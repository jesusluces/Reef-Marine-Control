const CACHE='reef-marine-control-v62';
const APP_SHELL=["./index.html", "./manifest.webmanifest", "./brand-title.png", "./reef-background.webp", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./dose-ca.png", "./dose-kh.png", "./dose-trace.png", "./measure-ca.png", "./measure-mg.png", "./measure-no3.png", "./measure-po4.png", "./measure-salinity.png", "./nav-dose.png", "./nav-history.png", "./nav-home.png", "./nav-measure.png"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(c=>c.put('./index.html',copy));
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response&&response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(c=>c.put(event.request,copy));
    }
    return response;
  })));
});
