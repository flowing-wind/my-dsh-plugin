import schema from "@deepseek-ai/schemastery";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
//#region lib/types/index.js
const scrypt$1 = promisify(scrypt);
/** Required deployment credentials; plaintext passwords are never configured. */
const Config = schema.object({
	passwordHash: schema.string().required(),
	idleMs: schema.natural().min(6e4).required(),
	attemptsPerMinute: schema.natural().min(1).required()
});
/** Browser transport and public login route owners. */
const inject = ["connection", "webServer"];
/** @param ctx - HTTP transport and lifecycle. @param config - Salted password digest and expiry policy. */
async function apply(ctx, config) {
	if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(config.passwordHash)) throw new Error("page-login: expected a 16-byte salt and 64-byte scrypt digest");
	const [salt, digest] = config.passwordHash.split(":");
	const expected = Buffer.from(digest, "hex");
	const sessions = /* @__PURE__ */ new Map();
	const attempts = /* @__PURE__ */ new Map();
	const script = await readFile(new URL("../assets/login.js", import.meta.url), "utf8");
	const revoke = (token) => {
		const session = sessions.get(token);
		sessions.delete(token);
		for (const socket of session?.sockets ?? []) socket.destroy();
	};
	const header = (request, name) => {
		const value = request.headers instanceof Headers ? request.headers.get(name) : request.headers[name];
		return typeof value === "string" ? value : void 0;
	};
	const credential = (request) => {
		const authorization = header(request, "authorization");
		return authorization?.startsWith("Bearer ") === true ? authorization.slice(7) : new URL(request.url ?? "/", "http://localhost").searchParams.get("pageToken") ?? "";
	};
	ctx.effect(() => ctx.connection.registerBrowserAuthentication({
		authenticatedUrl: (base) => base,
		authorizeIndex: () => true,
		isAuthenticated: (request) => {
			if (new URL(request.url ?? "/", "http://localhost").pathname === "/page-login") return true;
			const token = credential(request);
			const session = sessions.get(token);
			if (session === void 0) return false;
			if (Date.now() - session.seen > config.idleMs) {
				revoke(token);
				return false;
			}
			session.seen = Date.now();
			if (header(request, "upgrade")?.toLowerCase() === "websocket") {
				const socket = request.socket;
				session.sockets.add(socket);
				socket.once("close", () => session.sockets.delete(socket));
			}
			return true;
		}
	}));
	ctx.on("webserver/index-inject", (table) => {
		table.unshift({
			kind: "script",
			placement: "head",
			text: script
		});
	});
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: "/page-login",
		handler: async (req, res) => {
			res.setHeader("cache-control", "no-store");
			res.setHeader("referrer-policy", "no-referrer");
			if (ctx.connection.requestRejection(req) !== void 0) {
				res.writeHead(403);
				res.end();
				return;
			}
			if (req.method !== "POST") {
				res.writeHead(405);
				res.end();
				return;
			}
			let body = "";
			for await (const chunk of req) {
				body += String(chunk);
				if (Buffer.byteLength(body) > 1024) {
					res.writeHead(413);
					res.end();
					return;
				}
			}
			let input;
			try {
				input = JSON.parse(body);
			} catch (error) {
				res.writeHead(400);
				res.end();
				return;
			}
			if (typeof input !== "object" || input === null) {
				res.writeHead(400);
				res.end();
				return;
			}
			if ("logout" in input && typeof input.logout === "string") {
				revoke(input.logout);
				res.writeHead(204);
				res.end();
				return;
			}
			if (!("password" in input) || typeof input.password !== "string") {
				res.writeHead(400);
				res.end();
				return;
			}
			const address = req.socket.remoteAddress ?? "local";
			const now = Date.now();
			let attempt = attempts.get(address);
			if (attempt === void 0 || attempt.until <= now) {
				attempt = {
					until: now + 6e4,
					count: 0
				};
				attempts.set(address, attempt);
			}
			if (++attempt.count > config.attemptsPerMinute) {
				res.writeHead(429, { "retry-after": "60" });
				res.end();
				return;
			}
			if (!timingSafeEqual(await scrypt$1(input.password, Buffer.from(salt, "hex"), 64), expected)) {
				res.writeHead(401);
				res.end();
				return;
			}
			const token = randomBytes(32).toString("base64url");
			sessions.set(token, {
				seen: now,
				sockets: /* @__PURE__ */ new Set()
			});
			res.writeHead(200, { "content-type": "application/json" });
			res.end(JSON.stringify({ token }));
		}
	}));
	ctx.effect(() => {
		const timer = setInterval(() => {
			for (const [token, session] of sessions) if (Date.now() - session.seen > config.idleMs) revoke(token);
			for (const [key, attempt] of attempts) if (attempt.until < Date.now()) attempts.delete(key);
		}, 3e4);
		return () => {
			clearInterval(timer);
			for (const token of sessions.keys()) revoke(token);
		};
	});
}
//#endregion
export { Config, apply, inject };
