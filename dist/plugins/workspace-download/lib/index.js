import { SessionId } from "@deepseek-ai/dsh-session";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import schema from "@deepseek-ai/schemastery";
import { mkdir, mkdtemp, open, readdir, realpath, rm, stat } from "node:fs/promises";
import { constants, createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
//#region lib/types/archive.js
/** Bounded-memory ZIP creation; links and special files are omitted. */
/**
* Compress a directory inside a workspace to a private output file.
* @param root - Canonical workspace root.
* @param directory - Canonical directory contained by root.
* @param output - Exclusive temporary archive filename.
* @param signal - Request and plugin-lifetime cancellation.
* @returns Compressed bytes and omitted link/special-file count.
*/
async function archiveDirectory(root, directory, output, signal) {
	const file = await open(output, "wx", 384);
	const chunks = [];
	let failure = null;
	let bytes = 0;
	let skipped = 0;
	let entries = 0;
	const zip = new Zip((error, data) => {
		if (error) failure = error;
		else chunks.push(data);
	});
	const flush = async () => {
		if (failure) throw failure;
		for (const chunk of chunks.splice(0)) {
			signal.throwIfAborted();
			let offset = 0;
			while (offset < chunk.length) {
				const result = await file.write(chunk, offset, chunk.length - offset);
				offset += result.bytesWritten;
			}
			bytes += chunk.length;
			if (bytes >= 4294967295) throw new Error("Archive exceeds the ZIP32 format size; download smaller folders");
		}
	};
	const contained = async (path) => {
		const target = await realpath(path);
		const child = relative(root, target);
		if (child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) throw new Error("Directory entry is outside the workspace");
		return target;
	};
	const walk = async (path, name) => {
		signal.throwIfAborted();
		if (++entries >= 65535) throw new Error("Archive exceeds the ZIP32 entry limit; download smaller folders");
		const folder = new ZipPassThrough(name + "/");
		zip.add(folder);
		folder.push(new Uint8Array(), true);
		await flush();
		for (const entry of await readdir(await contained(path), { withFileTypes: true })) {
			signal.throwIfAborted();
			if (entry.name.includes("\\")) throw new Error("ZIP filenames cannot contain backslashes");
			const child = resolve(path, entry.name);
			const archiveName = name + "/" + entry.name;
			if (entry.isDirectory()) {
				await walk(child, archiveName);
				continue;
			}
			if (!entry.isFile()) {
				skipped++;
				continue;
			}
			if (++entries >= 65535) throw new Error("Archive exceeds the ZIP32 entry limit; download smaller folders");
			const source = await open(await contained(child), constants.O_RDONLY | constants.O_NOFOLLOW);
			try {
				const before = await source.stat();
				if (!before.isFile() || before.size >= 4294967295) throw new Error("Entry is not a ZIP32 regular file");
				const compressed = new ZipDeflate(archiveName, { level: 6 });
				zip.add(compressed);
				const buffer = Buffer.allocUnsafe(64 * 1024);
				let read = 0;
				for (;;) {
					signal.throwIfAborted();
					const part = await source.read(buffer, 0, buffer.length, null);
					if (part.bytesRead === 0) break;
					read += part.bytesRead;
					compressed.push(buffer.subarray(0, part.bytesRead), false);
					await flush();
				}
				const after = await source.stat();
				if (read !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) throw new Error("A file changed during compression; retry after writing finishes");
				compressed.push(new Uint8Array(), true);
				await flush();
			} finally {
				await source.close();
			}
		}
	};
	try {
		if (!(await stat(directory)).isDirectory()) throw new Error("Download target must be a directory");
		await walk(directory, basename(directory));
		zip.end();
		await flush();
		return {
			bytes,
			skipped
		};
	} finally {
		zip.terminate();
		await file.close();
	}
}
//#endregion
//#region lib/types/archive-route.js
/**
* Register two-phase archive preparation and download routes.
* @param ctx - Authenticated connection and durable Sessions.
* @param config - Archive storage and confirmation policy.
*/
function registerArchives(ctx, config) {
	if (!isAbsolute(config.archiveDirectory)) throw new Error("archiveDirectory must be an absolute path");
	const lifetime = new AbortController();
	const archives = /* @__PURE__ */ new Map();
	const pending = /* @__PURE__ */ new Set();
	let preparing = false;
	const remove = async (id) => {
		const archive = archives.get(id);
		if (!archive) return;
		archives.delete(id);
		clearTimeout(archive.timer);
		await rm(archive.directory, {
			recursive: true,
			force: true
		});
	};
	ctx.effect(() => async () => {
		lifetime.abort();
		await Promise.allSettled([...pending]);
		await Promise.all([...archives.keys()].map(remove));
	});
	ctx.connection.fetch.register({
		path: "/api/workspace-archive",
		methods: ["POST", "GET"],
		requestBody: "buffered",
		fetch: async (request) => {
			const query = new URL(request.url).searchParams;
			const sessionId = query.get("sessionId");
			if (!sessionId) return new Response("Conversation is required", { status: 400 });
			const signal = AbortSignal.any([request.signal, lifetime.signal]);
			if (request.method === "POST" && query.get("action") === "prepare") {
				if (preparing) return new Response("Another folder is being compressed; retry after it finishes", { status: 409 });
				preparing = true;
				const prepare = async () => {
					let directory;
					try {
						const input = await request.json();
						if (typeof input !== "object" || input === null || !("path" in input) || typeof input.path !== "string") return new Response("Folder path is required", { status: 400 });
						const session = await ctx.sessionPersistence.stat(SessionId(sessionId));
						if (!session?.header.cwd) return new Response("Conversation workspace not found", { status: 404 });
						const root = await realpath(session.header.cwd);
						const target = await realpath(resolve(root, input.path));
						const child = relative(root, target);
						if (child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) return new Response("Folder must be inside this workspace", { status: 403 });
						await mkdir(config.archiveDirectory, {
							recursive: true,
							mode: 448
						});
						const withinSource = relative(target, await realpath(config.archiveDirectory));
						if (withinSource === "" || withinSource !== ".." && !withinSource.startsWith(`..${sep}`) && !isAbsolute(withinSource)) return new Response("Archive storage must be outside the downloaded folder", { status: 400 });
						directory = await mkdtemp(join(config.archiveDirectory, "zip-"));
						const file = join(directory, "download.zip");
						const result = await archiveDirectory(root, target, file, signal);
						signal.throwIfAborted();
						const id = randomUUID();
						const requiresConfirmation = result.bytes > config.confirmationBytes;
						const timer = setTimeout(() => {
							remove(id).catch((error) => console.error("Archive cleanup failed", error));
						}, config.archiveLifetimeMs);
						timer.unref();
						archives.set(id, {
							directory,
							file,
							name: basename(target) + ".zip",
							bytes: result.bytes,
							sessionId,
							confirmed: !requiresConfirmation,
							timer
						});
						directory = void 0;
						return Response.json({
							id,
							...result,
							requiresConfirmation
						}, { headers: { "cache-control": "no-store" } });
					} catch (error) {
						return new Response(String(error), { status: 400 });
					} finally {
						try {
							if (directory) await rm(directory, {
								recursive: true,
								force: true
							});
						} finally {
							preparing = false;
						}
					}
				};
				const task = prepare();
				pending.add(task);
				try {
					return await task;
				} finally {
					pending.delete(task);
				}
			}
			const id = query.get("id");
			const archive = id ? archives.get(id) : void 0;
			if (!id || !archive || archive.sessionId !== sessionId) return new Response("Archive expired or not found", { status: 404 });
			if (request.method === "POST" && query.get("action") === "cancel") {
				await remove(id);
				return new Response(null, { status: 204 });
			}
			if (request.method === "POST" && query.get("action") === "confirm") {
				archive.confirmed = true;
				return new Response(null, { status: 204 });
			}
			if (request.method !== "GET") return new Response("Unknown archive action", { status: 400 });
			if (!archive.confirmed) return new Response("Confirm the compressed archive size before downloading", { status: 403 });
			clearTimeout(archive.timer);
			archives.delete(id);
			const stream = createReadStream(archive.file, { signal });
			const finished = new Promise((resolveDone) => {
				stream.once("close", () => {
					rm(archive.directory, {
						recursive: true,
						force: true
					}).catch((error) => console.error("Archive cleanup failed", error)).finally(resolveDone);
				});
			});
			pending.add(finished);
			finished.finally(() => pending.delete(finished));
			return new Response(Readable.toWeb(stream), { headers: {
				"content-type": "application/zip",
				"content-length": String(archive.bytes),
				"content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(archive.name).replace(/'/g, "%27")}`,
				"cache-control": "no-store",
				"x-content-type-options": "nosniff"
			} });
		}
	});
}
//#endregion
//#region lib/types/index.js
/** Explicit deployment archive settings. */
const Config = schema.object({
	archiveDirectory: schema.string().required(),
	confirmationBytes: schema.natural().min(1).required(),
	archiveLifetimeMs: schema.natural().min(1).required()
});
/** Required authenticated carrier and existing file-read policy. */
const inject = [
	"connection",
	"workspaceFiles",
	"sessions",
	"sessionPersistence"
];
/**
* Register a download route with bounded reads and cancellation.
* @param ctx - Authenticated Web context and composed filesystem.
*/
function apply(ctx, config) {
	registerArchives(ctx, config);
	ctx.connection.fetch.register({
		path: "/api/workspace-download",
		methods: ["GET"],
		requestBody: "buffered",
		fetch: async (request) => {
			const query = new URL(request.url).searchParams;
			const rawId = query.get("sessionId");
			const path = query.get("path");
			if (!rawId || !path) return new Response("Session and file path are required", { status: 400 });
			const sessionId = SessionId(rawId);
			const header = ctx.sessions.get(sessionId)?.header ?? (await ctx.sessionPersistence.stat(sessionId))?.header;
			if (header?.cwd === void 0) return new Response("Workspace session not found", { status: 404 });
			const scope = {
				sessionId,
				workspaceRoot: header.cwd
			};
			const initial = await ctx.workspaceFiles.stat(scope, path, request.signal);
			const cancellation = new AbortController();
			const signal = AbortSignal.any([request.signal, cancellation.signal]);
			let offset = 0;
			const body = new ReadableStream({
				async pull(controller) {
					try {
						const chunk = await ctx.workspaceFiles.readBytes(scope, path, { range: { offset } }, signal);
						if (chunk.version !== initial.version) throw new Error("File changed during download; retry after writing finishes");
						const bytes = chunk.data;
						offset += bytes.length;
						if (bytes.length > 0) controller.enqueue(bytes);
						if (chunk.eof) controller.close();
					} catch (error) {
						cancellation.abort(error);
						controller.error(error);
					}
				},
				cancel(reason) {
					cancellation.abort(reason);
				}
			});
			return new Response(body, { headers: {
				"content-type": "application/octet-stream",
				"content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(basename(initial.absolutePath)).replace(/'/g, "%27")}`,
				"cache-control": "no-store",
				"x-content-type-options": "nosniff",
				...initial.bytes === void 0 ? {} : { "content-length": String(initial.bytes) }
			} });
		}
	});
}
//#endregion
export { Config, apply, inject };
