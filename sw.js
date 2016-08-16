var CACHENAME = 'quick-test-v1';
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
            return fetchFromCache(request);
        }).catch(function() {
            return new Response('Oops, no cache found..');
        })
    );
});

function stripAPEXState(request){
    var match = urlRegex.exec(request.url);
    if (match != null) {
        //console.log(new Request(match));
        return new Request(match[0]);
    }
    return request;
}

function addToCache(request, response) {
    if(request.method == "GET" && response.ok) {
        var requestCopy = stripAPEXState(request);
        var responseCopy = response.clone();
        caches.open(CACHENAME).then(function(cache) {
            cache.put(requestCopy, responseCopy);
        });
    }
    return response;
}

function fetchFromCache(request) {
    var requestCopy = stripAPEXState(request);
    return caches.match(requestCopy).then(function(response){
        if(!response) {
            throw Error('${requestCopy.url} not found in cache');
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
        var str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

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
