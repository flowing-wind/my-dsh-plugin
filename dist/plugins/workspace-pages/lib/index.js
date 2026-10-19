import schema from "@deepseek-ai/schemastery";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { SessionId } from "@deepseek-ai/dsh-session";
//#region lib/types/shell.js
/**
* Render the isolated static preview wrapper.
* @param input - Server-validated root file and configured resource limits.
* @returns Standalone authenticated preview shell.
*/
function pageShell(input) {
	return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workspace preview</title><style>html,body{margin:0;height:100%;background:#151719;color:#eef2f5;font:16px system-ui}iframe{border:0;width:100%;height:100%;display:block}p{padding:20px;white-space:pre-wrap}</style><p id="status">Loading / 正在加载…</p><script>
(async()=>{
const config=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('${Buffer.from(JSON.stringify(input)).toString("base64")}'),c=>c.charCodeAt(0))));
const pageToken=new URL(location.href).searchParams.get('pageToken');
if(pageToken)history.replaceState(null,'',location.pathname+'?'+new URLSearchParams({sessionId:config.sessionId,path:config.path}));
const root=new URL(config.path,'https://workspace.invalid/');
let total=0,count=0;
const cache=new Map();
const local=(ref,base)=>{const u=new URL(ref,base);if(u.origin!=='https://workspace.invalid')throw Error('External resource blocked: '+ref);return u;};
async function load(url){const key=url.pathname;if(cache.has(key))return cache.get(key);if(++count>config.maxAssets)throw Error('Too many resources');const response=await fetch('/api/workspace-pages?'+new URLSearchParams({sessionId:config.sessionId,path:decodeURIComponent(key.slice(1)),asset:'1'}),{headers:pageToken?{authorization:'Bearer '+pageToken}:{}});if(!response.ok)throw Error(await response.text());const bytes=new Uint8Array(await response.arrayBuffer());total+=bytes.length;if(bytes.length>config.maxAssetBytes||total>config.maxTotalBytes)throw Error('Preview exceeds resource limit');const value={bytes,type:response.headers.get('content-type')};cache.set(key,value);return value;}
const text=value=>new TextDecoder('utf-8',{fatal:true}).decode(value.bytes);
const data=value=>{let raw='';for(let i=0;i<value.bytes.length;i+=8192)raw+=String.fromCharCode(...value.bytes.subarray(i,i+8192));return 'data:'+value.type+';base64,'+btoa(raw)};
async function image(ref,base){if(ref.startsWith('data:'))return ref;return data(await load(local(ref,base)));}
async function css(source,base){if(/@import/i.test(source))throw Error('CSS @import is unsupported; use a stylesheet link');const found=[...source.matchAll(/url\\(\\s*(['"]?)(.*?)\\1\\s*\\)/g)];for(const match of found){if(match[2].startsWith('#'))continue;source=source.replace(match[0],'url("'+await image(match[2],base)+'")');}return source;}
const parsed=new DOMParser().parseFromString(text(await load(root)),'text/html');
parsed.querySelectorAll('base,meta[http-equiv]').forEach(e=>e.remove());
for(const element of parsed.querySelectorAll('script[src]')){if(element.type==='module')throw Error('Use classic scripts or a self-contained HTML page; modules are unsupported');const url=local(element.getAttribute('src'),root);element.textContent=text(await load(url));element.removeAttribute('src');}
for(const element of parsed.querySelectorAll('link[rel~="stylesheet"]')){const url=local(element.getAttribute('href'),root);const style=parsed.createElement('style');style.textContent=await css(text(await load(url)),url);element.replaceWith(style);}
for(const element of parsed.querySelectorAll('style'))element.textContent=await css(element.textContent,root);
for(const element of parsed.querySelectorAll('[style]'))element.setAttribute('style',await css(element.getAttribute('style'),root));
for(const element of parsed.querySelectorAll('img[src],source[src],video[poster]')){const attr=element.hasAttribute('poster')?'poster':'src';element.setAttribute(attr,await image(element.getAttribute(attr),root));element.removeAttribute('srcset');}
parsed.querySelectorAll('[srcset]').forEach(e=>e.removeAttribute('srcset'));
const policy=parsed.createElement('meta');policy.httpEquiv='Content-Security-Policy';policy.content="default-src 'none'; script-src 'unsafe-inline' data: blob:; style-src 'unsafe-inline' data:; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";parsed.head.prepend(policy);
const frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.title=config.path;frame.src=URL.createObjectURL(new Blob(['<!doctype html>'+parsed.documentElement.outerHTML],{type:'text/html'}));document.body.replaceChildren(frame);
})().catch(error=>{document.getElementById('status').textContent=String(error)});
<\/script>`;
}
//#endregion
//#region lib/types/index.js
/** Static-page resource limits. */
const Config = schema.object({
	maxAssetBytes: schema.natural().min(1).required(),
	maxTotalBytes: schema.natural().min(1).required(),
	maxAssets: schema.natural().min(1).required()
});
/** Existing authenticated transport and conversation ownership. */
const inject = ["connection", "sessionPersistence"];
const mime = {
	".html": "text/html",
	".htm": "text/html",
	".css": "text/css",
	".js": "text/javascript",
	".json": "application/json",
	".pdf": "application/pdf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".txt": "text/plain",
	".md": "text/plain",
	".woff2": "font/woff2"
};
/** @param ctx - Host services. @param config - Resource limits exposed to the trusted preview shell. */
function apply(ctx, config) {
	ctx.inject(["systemPrompt"], (promptCtx) => {
		promptCtx.systemPrompt.section({
			name: "workspace-pages",
			order: promptCtx.systemPrompt.getSectionOrder("WEB_SURFACE"),
			text: () => "For an interactive explanation or small browser tool, create a static HTML page in the workspace. The user can open it from the workspace file sidebar in a new browser tab through the authenticated Harness domain. Use inline or local classic JavaScript, CSS, and images. No server process or public port is needed. The page runs in an isolated frame: remote requests, API access, ES modules, CSS @import, and form navigation are blocked. Keep the page self-contained or use relative local resource paths. Use responsive layout for phone and desktop screens."
		});
	});
	ctx.connection.fetch.register({
		path: "/api/workspace-pages",
		methods: ["GET"],
		requestBody: "buffered",
		fetch: async (request) => {
			try {
				const query = new URL(request.url).searchParams;
				const id = query.get("sessionId"), path = query.get("path");
				if (!id || !path) return new Response("Conversation and path are required", { status: 400 });
				const session = await ctx.sessionPersistence.stat(SessionId(id));
				if (!session?.header.cwd) return new Response("Workspace not found", { status: 404 });
				const root = await realpath(session.header.cwd);
				const target = await realpath(resolve(root, path));
				const child = relative(root, target);
				if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) return new Response("File is outside the workspace", { status: 403 });
				const info = await stat(target);
				if (!info.isFile() || info.size > config.maxAssetBytes) return new Response("Preview file exceeds configured size limit", { status: 413 });
				const type = mime[extname(target).toLowerCase()] ?? "text/plain";
				if (type === "text/html" && query.get("asset") !== "1") return new Response(pageShell({
					sessionId: id,
					path: child.split(sep).join("/"),
					maxAssetBytes: config.maxAssetBytes,
					maxTotalBytes: config.maxTotalBytes,
					maxAssets: config.maxAssets
				}), { headers: {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "no-store",
					"content-security-policy": "default-src 'none'; script-src 'unsafe-inline' data: blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'self'; frame-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
					"referrer-policy": "no-referrer"
				} });
				const bytes = await readFile(target);
				return new Response(bytes, { headers: {
					"content-type": type.startsWith("text/") ? `${type}; charset=utf-8` : type,
					"cache-control": "no-store",
					"x-content-type-options": "nosniff",
					"content-security-policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
					"content-disposition": query.get("asset") === "1" ? "attachment" : "inline",
					"content-length": String(bytes.length)
				} });
			} catch (error) {
				return new Response(String(error), { status: 400 });
			}
		}
	});
}
//#endregion
export { Config, apply, inject };
