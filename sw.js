var CACHENAME = 'testcache';
var cacheResources = [
	'sad.jpg'
];

self.addEventListener('install', function(event) {
	console.log('[install] Installing Service Worker...');
	event.waitUntil(
		caches.open(CACHENAME).then(function(cache) {
			console.log("[install] Caching all resources.");
			return cache.addAll(cacheResources);
		})
	);
});

// Cache files that were not successfully fetched from cache and fetched from the server
self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request).then(function(resp) {
			// Cache hit - return response
			if(resp) {
				console.log("[fetch] Cache hit, return response.", resp);
				return resp;
			}
			
			var fetchRequest = event.request.clone();

			return fetch(fetchRequest).then(function(response) {
				// return any invalid response
				if(!response || response.status !== 200 || response.type !== 'basic') {
					console.log("[fetch] Invalid response received.", response);
					return response;
				}

				var responseToCache = response.clone();

				// put in new cache if the request does not match with any cache
				caches.open(CACHENAME).then(function(cache) {
					console.log("[fetch] No matching cache, fetching new cache.", event.request.url);
					cache.put(event.request, responseToCache);
				});
				return response;
			});
		}).catch(function() {
			// Return something if matching failed and there's no internet connection
			console.log("[fetch] No matching, and the connection is off-line.");
			return caches.match('sad.jpg');
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