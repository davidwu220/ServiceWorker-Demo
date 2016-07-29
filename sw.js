var CACHENAME = 'quick-test-v10';
var cacheThese = [];
var urlRegex = new RegExp(/https:\/\/\S+\/ords\/f\?p=\d+:\d+/, '');

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
            return new Response('Oops, no cache found..');
        })
    );
});

function stripAPEXState(url){
    var match = urlRegex.exec(url);
    if (match != null) {
        console.log(new Request(match));
    }
}

function addToCache(request, response) {
    if(response.ok) {
        stripAPEXState(request.url);
        var copy = new Response(response);
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

self.addEventListener('sync', function(event) {
    function dateTime() {
        var date = new Date();
        var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        return str;
    }
    
    if(event.tag.startsWith('outbox-')) {
        event.waitUntil(
            self.registration.showNotification("Sync event fired!", {
                body: dateTime()
            })
        );
    }
});
