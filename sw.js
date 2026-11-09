// Subscription notice, 2026-11-09. Self-contained for reliable offline migration.
const NOTICE = "<!doctype html>\n<html lang=\"ru\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"theme-color\" content=\"#111110\">\n<title>Продление подписки · Точка Подсчёта</title>\n<link rel=\"manifest\" href=\"./manifest.json\">\n<link rel=\"icon\" href=\"./icons/icon-192.png\">\n<style>\n*{box-sizing:border-box}body{margin:0;background:#f5f5f0;color:#191919;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:28px 20px}.card{width:100%;max-width:460px}.brand{font-weight:750;font-size:15px;letter-spacing:.04em;margin:0 0 44px}.tag{display:inline-block;background:#e7e7dc;padding:8px 12px;border-radius:30px;font-size:13px}h1{font-size:clamp(30px,7vw,40px);line-height:1.12;letter-spacing:-.035em;margin:18px 0}p{font-size:17px;line-height:1.6;color:#56564e}.price{padding:23px 0;margin:26px 0;border-block:1px solid #d8d8ce;display:flex;align-items:baseline;gap:12px}.price strong{font-size:38px;letter-spacing:-.04em}.price span{color:#56564e}a.button{display:block;text-align:center;text-decoration:none;font-weight:650;padding:17px;border-radius:14px;background:#191919;color:#fff;margin-top:12px}a.button:hover{background:#37372f}a.phone{color:inherit;white-space:nowrap}.contact{background:#eaeae1;border-radius:14px;padding:18px;margin-top:12px;font-size:15px;line-height:1.6}.contact strong{display:block}footer{font-size:12px;color:#75756c;margin-top:32px;line-height:1.5}a:focus-visible{outline:3px solid #4263eb;outline-offset:4px}\n</style>\n</head>\n<body>\n<main class=\"card\">\n<div class=\"brand\">ТОЧКА ПОДСЧЁТА</div>\n<span class=\"tag\">Доступ по подписке</span>\n<h1>Продлите доступ<br>к калькулятору</h1>\n<p>Для продолжения работы обратитесь к владельцу приложения — <strong>Данильченко Юрию</strong>.</p>\n<div class=\"price\"><strong>1 000 ₽</strong><span>подписка на год</span></div>\n<a class=\"button\" href=\"https://vk.ru/yuradanilchenko\" target=\"_blank\" rel=\"noopener noreferrer\">Написать во ВКонтакте</a>\n<div class=\"contact\"><strong>Или свяжитесь в MAX по номеру</strong><a class=\"phone\" href=\"tel:+79168374259\">+7 916 837-42-59</a></div>\n<footer>Точка Подсчёта · Данильченко Юрий</footer>\n</main>\n<script>\nif ('serviceWorker' in navigator) {\n  window.addEventListener('load', () => {\n    navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'})\n      .then(registration => registration.update()).catch(() => {});\n  });\n}\n</script>\n</body>\n</html>\n";
const scopeURL = new URL(self.registration.scope);
function inScope(url) {
  return url.origin === scopeURL.origin && url.pathname.startsWith(scopeURL.pathname);
}
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Remove only this application's known caches; preserve other sites on this origin.
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => /^tochka-v/.test(key)).map(key => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    await Promise.all(windows.filter(client => inScope(new URL(client.url))).map(client =>
      client.navigate(new URL('index.html?subscription=20261109', self.registration.scope).href).catch(() => {})
    ));
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !inScope(url)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(Promise.resolve(new Response(NOTICE, {
      headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}
    })));
  }
});
