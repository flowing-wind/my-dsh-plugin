import schema from "@deepseek-ai/schemastery";
import { z } from "zod";
import { lstat, realpath, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { homedir } from "node:os";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { SessionId } from "@deepseek-ai/dsh-session";
import { WorkspaceId } from "@deepseek-ai/dsh-workspace";
//#region lib/types/paths.js
/** Canonical directory checks shared by desktop and Web workspace deletion. */
/**
* Test strict directory containment using the host platform's path rules.
* @param root - Absolute parent directory.
* @param target - Absolute candidate directory.
* @returns Whether target is a child of root, excluding root itself.
*/
function below(root, target) {
	const child = relative(root, target);
	return child !== "" && child !== ".." && !child.startsWith("../") && !child.startsWith("..\\") && !isAbsolute(child);
}
/**
* Check a registered directory without following an alias into another tree.
* @param target - Registered absolute directory.
* @param root - Optional administrator-imposed parent directory.
* @param home - User home, which cannot itself be deleted with its ancestors.
* @param protectedTrees - Harness storage, application and operating-system directories.
* @returns Whether this existing directory may be selected for disk deletion.
*/
async function canRemoveDirectory(target, root, home, protectedTrees) {
	if (!isAbsolute(target)) return false;
	const directory = resolve(target);
	if (resolve(directory, "..") === directory || relative(directory, home) === "" || below(directory, home)) return false;
	if (root !== void 0 && !below(root, directory)) return false;
	if (protectedTrees.some((tree) => relative(tree, directory) === "" || below(tree, directory) || below(directory, tree))) return false;
	try {
		if (root !== void 0) {
			const ancestor = resolve(directory, ...relative(root, directory).split(/[\\/]/).map(() => ".."));
			const [allowed, actual] = await Promise.all([stat(root, { bigint: true }), stat(ancestor, { bigint: true })]);
			if (allowed.dev !== actual.dev || allowed.ino !== actual.ino) return false;
		}
		const info = await lstat(directory);
		return info.isDirectory() && !info.isSymbolicLink() && relative(directory, await realpath(directory)) === "";
	} catch (error) {
		if (["ENOENT", "ENOTDIR"].includes(error.code ?? "")) return false;
		throw error;
	}
}
//#endregion
//#region lib/types/index.js
/** Explicit roots restrict deletion; protected directories are always excluded. */
const Config = schema.object({ managedWorkspaceRoot: schema.string() });
/** Existing persistence, Agent ownership, and authenticated transport services. */
const inject = [
	"connection",
	"sessionController",
	"workspaceRegistry",
	"sessionPersistence"
];
/**
* Mount management endpoints independently of billing and file browsing.
* @param ctx - Host service context.
* @param config - Directory deletion policy.
*/
async function apply(ctx, config) {
	if (config.managedWorkspaceRoot !== void 0 && !isAbsolute(config.managedWorkspaceRoot)) throw new Error("managedWorkspaceRoot must be absolute");
	const root = config.managedWorkspaceRoot === void 0 ? void 0 : await realpath(config.managedWorkspaceRoot);
	const home = await realpath(homedir());
	const systemTrees = process.platform === "win32" ? [join(home, "AppData"), ...[
		"SystemRoot",
		"ProgramFiles",
		"ProgramFiles(x86)",
		"ProgramData"
	].flatMap((key) => process.env[key] === void 0 ? [] : [process.env[key]])] : [
		"/etc",
		"/usr",
		"/var",
		"/boot",
		"/proc",
		"/sys",
		"/dev"
	];
	const protectedTrees = [
		dshHomePath(),
		dirname(process.execPath),
		...systemTrees
	].map((directory) => resolve(directory));
	const removable = (directory) => canRemoveDirectory(directory, root, home, protectedTrees);
	ctx.connection.fetch.register({
		path: "/api/workspace-management",
		methods: ["GET"],
		requestBody: "buffered",
		fetch: async (request) => Response.json({
			sessions: (await ctx.sessionController.list({}, request.signal)).items.map((item) => ({
				id: item.sessionId,
				cwd: item.cwd,
				running: item.running
			})),
			workspaces: await Promise.all(ctx.workspaceRegistry.list().map(async (item) => ({
				id: item.id,
				title: item.title,
				path: item.path,
				canDeleteFiles: await removable(item.path)
			})))
		}, { headers: { "cache-control": "no-store" } })
	});
	ctx.connection.fetch.register({
		path: "/api/workspace-management.delete",
		methods: ["POST"],
		requestBody: "buffered",
		fetch: async (request) => {
			try {
				const parsed = z.discriminatedUnion("kind", [z.object({
					kind: z.literal("session"),
					id: z.string().min(1),
					confirmed: z.literal(true)
				}), z.object({
					kind: z.literal("workspace"),
					id: z.string().min(1),
					confirmed: z.literal(true),
					deleteFiles: z.boolean(),
					deleteSessions: z.boolean()
				})]).safeParse(await request.json());
				if (!parsed.success) return new Response("Explicit deletion confirmation is required", { status: 400 });
				const selected = parsed.data;
				if (selected.kind === "session") {
					const id = SessionId(selected.id);
					await ctx.sessionController.deleteSession(id);
					await ctx.workspaceRegistry.unarchiveSession(id);
					for (const workspace of ctx.workspaceRegistry.list()) await workspace.detachSession(id);
				} else {
					const id = WorkspaceId(selected.id);
					const workspace = ctx.workspaceRegistry.get(id);
					if (workspace === void 0) return new Response("Workspace not found", { status: 404 });
					const target = resolve(workspace.path);
					if (selected.deleteFiles && !await removable(target)) return new Response("Directory is protected, aliased, missing, or outside the configured removable workspace root", { status: 403 });
					const headers = await ctx.sessionPersistence.list();
					const sessions = headers.filter((item) => workspace.sessionIds.includes(item.header.id) || item.header.cwd !== void 0 && (relative(target, resolve(item.header.cwd)) === "" || below(target, resolve(item.header.cwd)))).map((item) => item.header.id);
					if (selected.deleteSessions) {
						const owned = headers.filter((item) => workspace.sessionIds.includes(item.header.id) || item.header.cwd !== void 0 && relative(target, resolve(item.header.cwd)) === "").map((item) => item.header.id);
						for (const sessionId of owned) {
							await ctx.sessionController.deleteSession(sessionId);
							await ctx.workspaceRegistry.unarchiveSession(sessionId);
							for (const owner of ctx.workspaceRegistry.list()) await owner.detachSession(sessionId);
						}
					}
					if (selected.deleteFiles) await ctx.sessionController.withSessionsStopped(sessions, async () => {
						if (!await removable(target)) throw new Error("Workspace directory is no longer eligible for deletion");
						await rm(target, { recursive: true });
						await ctx.workspaceRegistry.delete(id);
					});
					else await ctx.workspaceRegistry.delete(id);
				}
				return Response.json({ deleted: true });
			} catch (error) {
				return new Response(error instanceof Error ? error.message : String(error), { status: 500 });
			}
		}
	});
}
//#endregion
export { Config, apply, inject };
