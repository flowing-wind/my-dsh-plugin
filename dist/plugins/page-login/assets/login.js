/* Page credentials intentionally live only in this closure. */
(() => {
  const ready = Promise.withResolvers();
  globalThis.__DSH_BOOT_READY__ = { promise: ready.promise, resolve() {} };
  let token = '';
  const nativeFetch = window.fetch.bind(window);
  const protectedUrl = value => {
    const url = new URL(value, location.href);
    return url.origin === location.origin && (url.pathname.startsWith('/api') || url.pathname.startsWith('/rpc'));
  };
  const authenticatedUrl = value => {
    const url = new URL(value, location.href);
    if (token && protectedUrl(url)) url.searchParams.set('pageToken', token);
    return url.href;
  };
  window.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : input;
    if (!protectedUrl(url)) return nativeFetch(input, init);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (token) headers.set('authorization', `Bearer ${token}`);
    const response = await nativeFetch(input, { ...init, headers });
    if (response.status === 401 && token) logout();
    return response;
  };
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = class extends OriginalWebSocket {
    constructor(url, protocols) {
      const target = new URL(url, location.href);
      if (target.host === location.host && token) target.searchParams.set('pageToken', token);
      super(target, protocols);
    }
  };
  const OriginalEventSource = window.EventSource;
  window.EventSource = class extends OriginalEventSource {
    constructor(url, options) { super(authenticatedUrl(url), options); }
  };
  const nativeOpen = window.open.bind(window);
  window.open = (url, ...args) => nativeOpen(url ? authenticatedUrl(url) : url, ...args);
  const nativeXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) { return nativeXhrOpen.call(this, method, authenticatedUrl(url), ...args); };
  const revoke = () => {
    if (!token) return;
    const value = token; token = '';
    navigator.sendBeacon('/page-login', new Blob([JSON.stringify({ logout: value })], { type: 'application/json' }));
  };
  function logout() { revoke(); location.replace(location.pathname); }
  globalThis.__DSH_PAGE_LOGOUT__ = logout;
  addEventListener('pagehide', revoke);
  addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (anchor && protectedUrl(anchor.href)) { anchor.href = authenticatedUrl(anchor.href); anchor.referrerPolicy = 'no-referrer'; }
  }, true);
  const resources = new MutationObserver(records => {
    for (const record of records) {
      const elements = record.type === 'attributes' ? [record.target] : [...record.addedNodes].filter(node => node instanceof Element);
      for (const element of elements) for (const node of [element, ...element.querySelectorAll('img[src],iframe[src],video[src],audio[src],source[src]')]) {
        if (!node.matches('img[src],iframe[src],video[src],audio[src],source[src]')) continue;
        const src = node.getAttribute('src');
        if (src && protectedUrl(src)) { const next = authenticatedUrl(src); if (src !== next) node.setAttribute('src', next); }
      }
    }
  });
  resources.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
  const show = async () => {
    const zh = navigator.language.startsWith('zh');
    const copy = zh ? { title:'请验证身份', password:'密码', enter:'进入', wrong:'密码不正确，请重试', busy:'尝试过于频繁，请稍后再试', error:'连接失败，请重试', hint:'仅当前页面有效' } : { title:'Verify your identity', password:'Password', enter:'Continue', wrong:'Incorrect password. Try again.', busy:'Too many attempts. Try again shortly.', error:'Connection failed. Try again.', hint:'Valid for this page only' };
    const style = document.createElement('style');
    style.textContent = `#page-login-cover{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:Canvas;color:CanvasText;font-family:system-ui}#page-login-cover form{box-sizing:border-box;width:min(380px,calc(100vw - 40px));padding:32px;border:1px solid color-mix(in srgb,CanvasText 18%,Canvas);border-radius:16px;background:Canvas}#page-login-cover h1{font-size:23px;margin:0 0 10px;font-weight:600}#page-login-cover p{font-size:13px;opacity:.7;margin:0 0 25px}#page-login-cover label{font-size:14px;display:block;margin-bottom:9px}#page-login-cover input{box-sizing:border-box;width:100%;padding:12px 14px;background:Field;border:1px solid color-mix(in srgb,CanvasText 25%,Canvas);border-radius:8px;color:FieldText;font-size:16px}#page-login-cover input:focus-visible{outline:2px solid #4d6bfe;outline-offset:2px}#page-login-cover button{width:100%;margin-top:18px;padding:12px;border:0;border-radius:8px;background:#4d6bfe;color:white;font-size:15px;cursor:pointer}#page-login-cover button:disabled{opacity:.6}#page-login-error{font-size:13px;min-height:18px;margin-top:12px}`;
    document.head.append(style);
    const cover = document.createElement('div'); cover.id = 'page-login-cover';
    cover.innerHTML = `<form role="dialog" aria-modal="true" aria-labelledby="page-login-title"><h1 id="page-login-title"></h1><p></p><label for="page-password"></label><input id="page-password" type="password" autocomplete="current-password" required maxlength="256"><div id="page-login-error" role="alert"></div><button type="submit"></button></form>`;
    cover.querySelector('h1').textContent=copy.title; cover.querySelector('p').textContent=copy.hint; cover.querySelector('label').textContent=copy.password; cover.querySelector('button').textContent=copy.enter;
    document.body.append(cover);
    const password = cover.querySelector('input'); password.focus();
    cover.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const button=cover.querySelector('button'); button.disabled=true;
      try {
        const response=await nativeFetch('/page-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:password.value})});
        password.value='';
        if (!response.ok) { cover.querySelector('[role=alert]').textContent=response.status===429?copy.busy:copy.wrong; password.focus(); return; }
        token=(await response.json()).token;
        globalThis.__DSH_SETTINGS_AUTHENTICATED__ = true;
        cover.remove();
        ready.resolve();
      } catch(error) { cover.querySelector('[role=alert]').textContent=copy.error; }
      finally { button.disabled=false; }
    };
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});else show();
})();
