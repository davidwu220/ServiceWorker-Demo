var CACHENAME = "testcache";
var cacheResources = [
	"/",
	"style.css",
	"app.js",
	"db.js",
	"sw.js",
	"favicon.ico"
]

self.addEventListener('install', function(event) {
	console.log("downloading to cache");
	event.waitUntil(
		caches.open(CACHENAME).then(function(cache) {
			console.log("cache open");
			return cache.addAll(cacheResources);
		})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request).then(function(response){
			if (response) {
				console.log("caught response for", response.url);
				return response;
			}
			return fetch(event.request);
		})
	);
});