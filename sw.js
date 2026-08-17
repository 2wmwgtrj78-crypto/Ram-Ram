/* Cache-first so the app opens with no network at all.
   "./" and "./index.html" are both listed: a static host serves index.html at
   the root, so caching only the named file leaves the installed app offline-blind. */
var CACHE = "surgimaster-v19";
var ASSETS = ["./", "./index.html", "./SurgiMaster.html", "./manifest.webmanifest",
              "./icon.png", "./icon-512.png"];
self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ASSETS.map(function(a){
      return c.add(a).catch(function(){});   /* one missing file must not abort the install */
    }));
  }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k===CACHE?null:caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(function(r){
    return r || fetch(e.request).then(function(resp){
      var copy=resp.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return resp;
    }).catch(function(){
      if(e.request.mode==="navigate")
        return caches.match("./index.html").then(function(x){ return x || caches.match("./SurgiMaster.html"); });
    });
  }));
});
