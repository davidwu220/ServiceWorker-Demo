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

// Try to fetch from the network; if unsucessful, then return from the cache;
// fallback to default image if necessary
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
