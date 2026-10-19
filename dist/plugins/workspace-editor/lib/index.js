import schema from "@deepseek-ai/schemastery";
import { z } from "zod";
import { open, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { SessionId } from "@deepseek-ai/dsh-session";
//#region lib/types/index.js
/** Deployment editing limit. */
const Config = schema.object({ maxBytes: schema.natural().min(1).required() });
/** Authenticated transport and persisted workspace ownership. */
const inject = ["connection", "sessionPersistence"];
const input = z.object({
	sessionId: z.string().min(1),
	path: z.string().min(1),
	text: z.string(),
	version: z.string()
});
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
/** @param ctx - Host services. @param config - Maximum editable UTF-8 file size. */
function apply(ctx, config) {
	ctx.connection.fetch.register({
		path: "/api/workspace-editor",
		methods: ["GET", "POST"],
		requestBody: "buffered",
		fetch: async (request) => {
			try {
				const query = new URL(request.url).searchParams;
				const edit = request.method === "POST" ? input.parse(await request.json()) : void 0;
				const id = edit?.sessionId ?? query.get("sessionId");
				const path = edit?.path ?? query.get("path");
				if (!id || !path) return new Response("Conversation and file are required", { status: 400 });
				const session = await ctx.sessionPersistence.stat(SessionId(id));
				if (!session?.header.cwd) return new Response("Conversation workspace not found", { status: 404 });
				const root = await realpath(session.header.cwd);
				const target = await realpath(resolve(root, path));
				const child = relative(root, target);
				if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) return new Response("File must be inside this workspace", { status: 403 });
				const file = await open(target, (edit ? constants.O_RDWR : constants.O_RDONLY) | constants.O_NOFOLLOW);
				try {
					const stat = await file.stat();
					if (!stat.isFile() || stat.size > config.maxBytes) return new Response("File is not an editable text file or exceeds the editing limit", { status: 413 });
					const bytes = await file.readFile();
					if (bytes.includes(0)) return new Response("Binary files cannot be edited", { status: 415 });
					const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
					if (edit === void 0) return Response.json({
						text,
						version: hash(bytes),
						path: child
					}, { headers: { "cache-control": "no-store" } });
					if (hash(bytes) !== edit.version) return new Response("File changed since it was opened. Reload before saving.", { status: 409 });
					const next = Buffer.from(edit.text);
					if (next.length > config.maxBytes) return new Response("Edited file exceeds the editing limit", { status: 413 });
					let written = 0;
					while (written < next.length) {
						const part = await file.write(next, written, next.length - written, written);
						written += part.bytesWritten;
					}
					await file.truncate(next.length);
					return Response.json({
						text: edit.text,
						version: hash(next),
						path: child
					});
				} finally {
					await file.close();
				}
			} catch (error) {
				return new Response(String(error), { status: 400 });
			}
		}
	});
}
//#endregion
export { Config, apply, inject };
