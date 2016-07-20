var CACHENAME = 'static';
var UNAVAILABLE_FILE = "sad.jpg"; 
var config = {
    version: 'alpha_v1',
    cacheResources: [
        UNAVAILABLE_FILE
    ]
};

function cacheName(key, opts) {
    return `${opts.version}-${key}`;
}

function addToCache(cacheKey, request, response) {
    if (response.ok) {
        var copy = response.clone();
        caches.open(cacheKey).then(function(cache) {
            cache.put(request, copy);
        });
    }
    
    return response;
}

function fetchFromCache(event) {
    return caches.match(event.request).then(function(response) {
        if (!response) {
            // A synchronous error that will kick off the catch handler
            throw Error(`${event.request.url} not found in cache`);
        }

        return response;
    });
}

function offlineResponse(opts) {
    return caches.match(UNAVAILABLE_FILE);
}


self.addEventListener('install', function(event) {
	console.log('[install] Installing Service Worker...');
    
    function onInstall(event, opts) {
        var cacheKey = cacheName(CACHENAME, opts);
        return caches.open(cacheKey).then(function (cache) {
            return cache.addAll(opts.cacheResources);
        });
    }
    
    event.waitUntil(
        onInstall(event, config)
//        .then(function() {
//            return self.skipWaiting();
//        })
    );
});

self.addEventListener("activate", function(event) {
    function onActivate(event, opts) {
        return caches.keys().then(function(cacheKeys) {
            var oldCacheKeys = cacheKeys.filter(function(key) {
                return key.indexOf(opts.version) !== 0;
            });
            var deletePromises = oldCacheKeys.map(function(oldKey) {
               return caches.delete(oldKey); 
            });
            
            return Promise.all(deletePromises);
        });
    }
    
	event.waitUntil(
        onActivate(event, config)
//        .then(function() {
//            console.log("[activate] Claiming service worker from old script");
//            self.clients.claim();
//        })
    )
});

// Try to fetch from the network; if unsuccessful, then return from the cache;
// fallback to default image if necessary
self.addEventListener('fetch', function(event) {
    
    function shouldHandleFetch (event, opts) {
        // Should satisfy following criteria; otherwise we won't handle the request
        var request = event.request;
        var url = new URL(request.url);
        
        // Criteria
        // 1. The request HTTP method should be GET
        // 2. The request should be for a resource from my origin (xyz.com)
        var criteria = {
            isGETRequest        : request.method === 'GET',
            isFromMyOrigin      : url.origin === self.location.origin
        };
        
        // Create a new array with just the keys from criteria that have failing (false) values
        var failingCriteria = Object.keys(criteria).filter(function(criteriaKey) {
            return !criteria[criteriaKey];
        });
        
        if(failingCriteria.length) {
            console.log('[fetch-shouldHandleFetch] Not matching the set criteria', failingCriteria);
        }
        
        // If that failing array has any length, one or more tests failed
        return !failingCriteria.length;
    }
    
    function onFetch (event, opts) {
        var request = event.request;
        var acceptHeader = request.headers.get('Accept');
        var cacheKey;
        
        // {String} [static|image|content]
        cacheKey = cacheName(CACHENAME, opts);
        
		// Use a network-first strategy
		event.respondWith(
		    fetch(request, {cache: 'no-store'})
		    .then(function(response) {
		        console.log('[fetch-resourceType==content] Trying to fetch from the internet');
		        return addToCache(cacheKey, request, response);
		    }).catch(function() {
		        console.log('[fetch-resourceType==content] Fetching from cache');
		        return fetchFromCache(event);
		    }).catch(function() {
		        console.log('[fetch-resourceType==content] Cannot match anything from cache');
		        return offlineResponse(opts);
		    })
		);
    }
    
    if (shouldHandleFetch(event, config)) {
        onFetch(event, config);
    }
});

// self.addEventListener('push', function(event) {
// 	console.log('[push] Push message received', event);

// 	//TODO
// });
