/** Trusted wrapper packs local dependencies before executing HTML in an opaque iframe. */
interface Input { sessionId: string; path: string; maxAssetBytes: number; maxTotalBytes: number; maxAssets: number }
/** @param input - Server-validated root file and configured resource limits. @returns Standalone authenticated preview shell. */
export function pageShell(input: Input): string {
  const payload = Buffer.from(JSON.stringify(input)).toString('base64')
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workspace preview</title><style>html,body{margin:0;height:100%;background:#151719;color:#eef2f5;font:16px system-ui}iframe{border:0;width:100%;height:100%;display:block}p{padding:20px;white-space:pre-wrap}</style><p id="status">Loading / 正在加载…</p><script>
(async()=>{
const config=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob('${payload}'),c=>c.charCodeAt(0))));
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
</script>`
}
