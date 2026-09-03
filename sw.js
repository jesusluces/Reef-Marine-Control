const CACHE='reef-marine-control-v75';
const ASSETS=[
  './','./index.html','./app.js','./manifest.webmanifest',
  './brand-title.png','./dose-ca.png','./dose-kh.png','./dose-trace.png',
  './icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png',
  './measure-ca.png','./measure-mg.png','./measure-no3.png','./measure-po4.png','./measure-salinity.png',
  './nav-dose.png','./nav-history.png','./nav-home.png','./nav-measure.png','./reef-background.png','./reef-art-background.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r})));
});
