var CACHENAME = "testcache";
var cacheResources = ["index.html", "/", "style.css", "app.js", "db.js", "sw.js"];

self.addEventListener("install", function(event) {
	console.log("[install] saving resources to cache");
	event.waitUntil(caches.open(CACHENAME)
		.then(function(cache) {
			return cache.addAll(cacheResources);
		})
		.then(function() {
			console.log("[install] cached all resources");
			return self.skipWaiting();
		}));
});

// override fetch()'s default behavior to look in the cache first
var nocacheHeaders = new Headers();
nocacheHeaders.append("pragma", "no-cache");
nocacheHeaders.append("cache-control", "no-cache");
self.addEventListener("fetch", function(event) {
	var request = event.request;
	if (request.method === "GET") {
		event.respondWith(
			fetch(request.url, {
				method: request.method,
				headers: nocacheHeaders,
				mode: "same-origin",
				credentials: request.credentials,
				redirect: "manual"
			})
			.then(function(response) {
				console.log("pulling", response, "from network");
				return response;
			})
			.catch(function(error) {
				return caches.open(CACHENAME)
					.then(function(cache) {
						return cache.match(request);
					})
					.then(function(response) {
						console.log("pulling", response, "from cache");
						return response;
					});
			})
		);
	}
});

self.addEventListener("activate", function(event) {
	console.log("[activate] claiming serviceworker");
	event.waitUntil(self.clients.claim());
});
