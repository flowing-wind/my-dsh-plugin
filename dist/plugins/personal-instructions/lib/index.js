import schema from "@deepseek-ai/schemastery";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath } from "node:fs/promises";
import { dirname } from "node:path";
import { withFileLock, writeFileAtomic } from "@deepseek-ai/dsh-atomic-write";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
//#region lib/types/index.js
/** Bounds writes to the authenticated settings endpoint. */
const Config = schema.object({ maxBytes: schema.natural().min(1024).default(131072) });
/** Required authenticated HTTP service. */
const inject = ["connection"];
function revisionOf(content) {
	return createHash("sha256").update(content).digest("hex");
}
async function readInstructions(file) {
	const entry = await lstat(file).catch((error) => {
		if (error.code === "ENOENT") return void 0;
		throw error;
	});
	const target = entry?.isSymbolicLink() ? await realpath(file) : file;
	const content = entry === void 0 ? "" : await readFile(target, "utf8");
	return {
		target,
		content,
		revision: revisionOf(content)
	};
}
/**
* Register the editor for the same Harness home that native instruction loading uses.
* @param ctx - Authenticated connection lifecycle.
* @param config - Editor write limit.
*/
function apply(ctx, config) {
	const file = dshHomePath("AGENTS.md");
	const headers = { "cache-control": "no-store" };
	ctx.effect(() => ctx.connection.fetch.register({
		path: "/api/personal-instructions",
		methods: ["GET", "POST"],
		requestBody: "buffered",
		fetch: async (request) => {
			if (request.method === "GET") {
				const { content, revision } = await readInstructions(file);
				return Response.json({
					content,
					revision
				}, { headers });
			}
			const body = await request.text();
			if (Buffer.byteLength(body) > config.maxBytes * 6 + 128) return new Response(null, { status: 413 });
			let input;
			try {
				input = JSON.parse(body);
			} catch (_error) {
				return new Response(null, { status: 400 });
			}
			if (typeof input !== "object" || input === null || !("content" in input) || typeof input.content !== "string" || !("revision" in input) || typeof input.revision !== "string") return new Response(null, { status: 400 });
			const { content, revision } = input;
			if (Buffer.byteLength(content) > config.maxBytes) return new Response(null, { status: 413 });
			await mkdir(dirname(file), {
				recursive: true,
				mode: 448
			});
			return withFileLock(file, async () => {
				const current = await readInstructions(file);
				if (current.revision !== revision) return new Response(null, { status: 409 });
				await writeFileAtomic(current.target, content, { mode: 384 });
				return Response.json({ revision: revisionOf(content) }, { headers });
			}, { signal: request.signal });
		}
	}));
}
//#endregion
export { Config, apply, inject };
