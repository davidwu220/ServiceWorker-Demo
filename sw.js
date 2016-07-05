(function() {
	if(navigator.serviceWorker) {
		console.log('[registerSW] This browser supports service worker.');
		if(navigator.serviceWorker.controller) {
			console.log('[registerSW] Service worker is active already.');
		} else {
			navigator.serviceWorker.register('sw.js', {scope : './'}).then(function(reg) {
				console.log('[registerSW] Registration complete.', reg.scope);
				console.log('[registerSW] Reloading the page...');
				location.reload();
			}).catch(function(error) {
				console.log('[registerSW] There\'s and error while registering.', error);
			});
		}
	} else {
		console.log('[registerSW] This browser does not support service worker.');
	}
})();

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

// Cache files that were not successfully fetched from cache and fetched from the server
self.addEventListener('fetch', function(event) {	
	var request = event.request;
	event.respondWith(
		fetch(event.request).then(function(response){
			return response || caches.open(CACHENAME).then(function(cache){ return cache.match(request)})
		}).catch(function() {
			return caches.match(UNAVAILABLE_FILE);
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
