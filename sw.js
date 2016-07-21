var CACHENAME = 'quick-test-v1';
var offlineImage = '/images/sad.jpg';
var cacheThese = [
    './',
    offlineImage
];

self.addEventListener('install', function(event) {
    event.waitUntil(caches.open(CACHENAME).then(function(cache) {
        return cache.addAll(cacheThese);
    }));
});

self.addEventListener('fetch', function(event) {
    var request = event.request;
    
    event.respondWith(
        fetch(request, {cache: "no-store"}).then(function(response) {
            return addToCache(request, response);
        }).catch(function() {
            return fetchFromCache(event);
        }).catch(function(){
            return caches.match(offlineImage);
        })
    );
});

function addToCache(request, response) {
    if(response.ok) {
        var copy = response.clone();
        caches.open(CACHENAME).then(function(cache) {
            cache.put(request, copy);
        });
    }
    return response;
}

function fetchFromCache(event) {
    return caches.match(event.request).then(function(response){
        if(!response) {
            throw Error('${event.request.url} not found in cache');
        }
        
        return response;
    });
}

self.addEventListener('activate', function(event) {
      function onActivate (event, cacheName) {
          return caches.keys().then(function(cacheKeys) {
              var oldCacheKeys = cacheKeys.filter(function(key) {
                  return key.indexOf(cacheName) !== 0;
              });
              
              var deletePromises = oldCacheKeys.map(function(oldKey) {
                  return caches.delete(oldKey);
              });
              
              return Promise.all(deletePromises);
        });
    }

    event.waitUntil(
        onActivate(event, CACHENAME).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('message', function(event) {
   if(event.data.action == 'skipWaiting') {
       self.skipWaiting();
   } 
});