var CACHENAME = 'testcache';
var UNAVAILABLE_FILE = "sad.jpg";
var cacheResources = [
	UNAVAILABLE_FILE
];


self.addEventListener('install', function(event) {
	console.log('[install] Installing Service Worker...');
	event.waitUntil(
		caches.open(CACHENAME).then(function(cache) {
			console.log("[install] Caching all resources.");
			return cache.addAll(cacheResources);
		}).then(function() {
			console.log('[install] Cached all resources.', cacheResources);
			return self.skipWaiting();
		}));
});

// override fetch()'s default behavior to look in the cache first
// var nocacheHeaders = new Headers();
// nocacheHeaders.append("pragma", "no-cache");
// nocacheHeaders.append("cache-control", "no-cache");
// self.addEventListener("fetch", function(event) {
	// var request = event.request;
	// if (request.method === "GET") {
		// event.respondWith(
			// fetch(request.url, {
				// method: request.method,
				// headers: nocacheHeaders,
				// mode: "same-origin",
				// credentials: request.credentials,
				// redirect: "manual"
			// })
			// .then(function(response) {
				// console.log("pulling", response, "from network");
				// return response;
			// })
			// .catch(function(error) {
				// return caches.open(CACHENAME)
					// .then(function(cache) {
						// return cache.match(request);
					// })
					// .then(function(response) {
						// console.log("pulling", response, "from cache");
						// return response;
					// });
			// })
		// );
	// }
// });

// self.addEventListener("activate", function(event) {
	// console.log("[activate] claiming serviceworker");
	// event.waitUntil(self.clients.claim());
// });

// override fetch()'s default behavior to look in the cache first
var nocacheHeaders = new Headers();
nocacheHeaders.append("pragma", "no-cache");
nocacheHeaders.append("cache-control", "no-cache");

function promiseFromCache(request){

}

// Cache files that were not successfully fetched from cache and fetched from the server
self.addEventListener('fetch', function(event) {	
	var request = event.request;
	event.respondWith(
		fetch(request.url, {
			method: request.method,
			headers: nocacheHeaders,
			mode: "same-origin",
			credentials: request.credentials,
			redirect: "manual"
		}).then(function(fetchResponse) {
			console.log("[net]", request.url, fetchResponse.statusText);
			if (!fetchResponse || !fetchResponse.ok) {
				throw Error(request);
			}
			console.log(fetchResponse.bodyUsed);
			caches.open(CACHENAME).then(function(cache){
				cache.match(request).then(function(cacheResponse){
					if (!cacheResponse) {
						console.log("[cachePut]", request.url);
						cache.put(request, fetchResponse.clone());
					} else {
						console.log("[cachePut]", request.url, "already cached");
					}
				})
			})
			return fetchResponse;
		}).catch(function(error){
			console.log(error);
			return caches.open(CACHENAME).then(function(cache) {
				return cache.match(request);
			}).then(function(cacheResponse) {
				if (cacheResponse) {
					console.log("[cacheMatch]", request.url, cacheResponse.statusText);
					return cacheResponse;
				}
				return caches.match(UNAVAILABLE_FILE);
			});
		})
	);
});

self.addEventListener("activate", function(event) {
	console.log("[activate] Claiming service worker from old script");
	event.waitUntil(self.clients.claim());
});

// self.addEventListener('push', function(event) {
// 	console.log('[push] Push message received', event);

// 	//TODO
// });
