var CACHENAME = "testcache";
var cacheResources = [
	"index.html",
	"style.css",
	"app.js",
	"db.js",
	"favicon.ico"
]

self.addEventListener("install", function(event) {
	event.waitUntil(
		caches.open(CACHENAME).then(function(cache) {
			console.log("[install] saving resources to cache");
			return cache.addAll(cacheResources);
		}).then(function() {
			console.log("[install] cached all resources");
			return self.skipWaiting();
		})
	);
});

self.addEventListener("fetch", function(event){
	event.respondWith(
		caches.match(event.request).then(function(response) {
			if (response) {
				console.log("[fetch] responding using serviceworker cache", event.request.url);
				return response;
			}
			
			console.log("[fetch] responding using network", event.request.url);
			return fetch(event.request);
		})
	);
});

self.addEventListener("activate", function(event) {
	console.log("[activate] claiming serviceworker from old script");
	event.waitUntil(self.clients.claim());
});