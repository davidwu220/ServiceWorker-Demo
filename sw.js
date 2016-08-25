let _SW_VERSION = 1;
let _CACHE_NAME = 'drydock_sw_v' + _SW_VERSION;
let _CACHE_THESE = [];
let _URL_REGEXP = new RegExp(/https:\/\/\S+\/ords\/f\?p=\d+:\d+/, '');

/**
 * On install, cache everything in the variable _CACHE_THESE.
 */
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(_CACHE_NAME)
            .then(cache => cache.addAll(_CACHE_THESE))
            .then(() => self.skipWaiting())
    );
});

/**
 * On a fetch event from the controlled page,
 * try to fetch from the network first, skipping local caches;
 *      if there is a response, store the response in the cache and
 *      pass one back to the page;
 * if the network doesn't return anything, fetch from the cache;
 * if the cache doesn't exist, or throws an error,
 * display our default response.
 */
self.addEventListener('fetch', function(event) {
    var request = event.request;

    event.respondWith(
        fetch(request, {cache: "no-store"}).then(function(response) {
            return addToCache(request, response);
        }).catch(function() {
            return fetchFromCache(request);
        }).catch(function(e) {
            console.error(e);
            return new Response('Oops, no cache found..');
        })
    );
});

/**
 * Strips unnecessary parameters from the 
 * APEX page url, including session state information.
 * 
 * For example, if we pass in a request for 
 * http://localhost/ords/f?p=103:3:16127763978723:::::,
 * we would discard everything after the second colon, returning
 * a request for http://localhost/ords/f?p=103:3.
 * 
 * Currently, this is simply used as a key in our cache;
 * it's not used to make an actual request from the server.
 */
function stripAPEXState(request){
    var match = _URL_REGEXP.exec(request.url);
    if (match != null) {
        //console.log(new Request(match));
        return new Request(match[0]);
    }
    return request;
}

/**
 * Adds the request-response pair to Caches.
 * Returns a copy of the response to be passed to the page.
 */
function addToCache(request, response) {
    if(request.method == "GET" && response.ok) {
        var requestCopy = stripAPEXState(request);
        var responseCopy = response.clone();
        caches.open(_CACHE_NAME)
            .then(function(cache) {
                cache.put(requestCopy, responseCopy);
            });
    }
    
    return response;
}

/**
 * Fetches the corresponding response for this request
 * from Caches.
 */
function fetchFromCache(request) {
    var requestCopy = stripAPEXState(request);
    return caches.match(requestCopy).then(function(response){
        if(!response) {
            throw Error('${requestCopy.url} not found in cache');
        }
        
        return response;
    });
}

/**
 * On activation, delete any caches that don't match our current
 * cache version and attempt to claim all pages within the
 * serviceworker's scope.
 */
self.addEventListener('activate', function(event) {
      function onActivate (event, cacheName) {
          return caches.keys()
              .then(function(cacheKeys) {
                  var oldCacheKeys = cacheKeys.filter(key => key.indexOf(cacheName) !== 0);

                  var deletePromises = oldCacheKeys.map(oldKey => caches.delete(oldKey));

                  return Promise.all(deletePromises);
              });
    }

    event.waitUntil(
        onActivate(event, _CACHE_NAME)
            .then(() => self.clients.claim())
    );
});
