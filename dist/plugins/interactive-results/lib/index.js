import schema from "@deepseek-ai/schemastery";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { SessionId } from "@deepseek-ai/dsh-session";
import { z } from "zod";
//#region lib/types/wire.js
/** Declarative result format; no executable code or remote resources. */
/** Agent-authored tables, bar charts, and explicitly submitted forms. */
const resultSchema = z.object({
	title: z.string(),
	blocks: z.array(z.discriminatedUnion("type", [
		z.object({
			type: z.literal("table"),
			columns: z.array(z.string()).min(1),
			rows: z.array(z.array(z.string()))
		}),
		z.object({
			type: z.literal("bar"),
			entries: z.array(z.object({
				label: z.string(),
				value: z.number().finite().nonnegative()
			}))
		}),
		z.object({
			type: z.literal("form"),
			fields: z.array(z.object({
				name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
				label: z.string(),
				type: z.enum([
					"text",
					"number",
					"select"
				]),
				options: z.array(z.string()).optional()
			}))
		})
	]))
});
//#endregion
//#region lib/types/index.js
/** Deployment result size limit. */
const Config = schema.object({ maxBytes: schema.natural().min(1).required() });
/** Existing prompt, file ownership, and authenticated carrier. */
const inject = ["connection", "sessionPersistence"];
/** @param ctx - Host services. @param config - Result size limit. */
function apply(ctx, config) {
	ctx.inject(["systemPrompt"], (promptCtx) => {
		promptCtx.systemPrompt.section({
			name: "interactive-results",
			order: promptCtx.systemPrompt.getSectionOrder("WEB_SURFACE"),
			text: () => "For an interactive table, bar chart, or form, write a UTF-8 file ending .interactive.json inside the workspace and call present with that path. Format: {\"title\":\"Title\",\"blocks\":[{\"type\":\"table\",\"columns\":[\"Name\",\"Value\"],\"rows\":[[\"Example\",\"12\"]]},{\"type\":\"bar\",\"entries\":[{\"label\":\"Example\",\"value\":12}]},{\"type\":\"form\",\"fields\":[{\"name\":\"choice\",\"label\":\"Choose\",\"type\":\"select\",\"options\":[\"A\",\"B\"]}]}]}. Form fields support text, number, select. Users can search tables and interact locally without a model request; only clicking Send to Agent submits form values as a normal user message. Do not include secrets in delivered files."
		});
	});
	ctx.connection.fetch.register({
		path: "/api/interactive-results",
		methods: ["GET"],
		requestBody: "buffered",
		fetch: async (request) => {
			try {
				const query = new URL(request.url).searchParams, id = query.get("sessionId"), path = query.get("path");
				if (!id || !path) return new Response("Conversation and path are required", { status: 400 });
				const session = await ctx.sessionPersistence.stat(SessionId(id));
				if (!session?.header.cwd) return new Response("Workspace not found", { status: 404 });
				const root = await realpath(session.header.cwd), target = await realpath(resolve(root, path)), child = relative(root, target);
				if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) return new Response("Result is outside the workspace", { status: 403 });
				if ((await stat(target)).size > config.maxBytes) return new Response("Interactive result exceeds configured limit", { status: 413 });
				return Response.json(resultSchema.parse(JSON.parse(await readFile(target, "utf8"))), { headers: { "cache-control": "no-store" } });
			} catch (error) {
				return new Response(String(error), { status: 400 });
			}
		}
	});
}
//#endregion
export { Config, apply, inject };
