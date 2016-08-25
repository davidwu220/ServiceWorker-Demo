if(typeof swHelper === 'undefined') {
    var swHelper = {};
    
    (function() {
        /**
         * If this serviceworker is waiting for the old
         * serviceworker to be unregistered, force a 
         * page reload.
         * @param worker [SW] a serviceworker object
         */
        function trackInstalling(worker) {
            worker.addEventListener('statechange', function() {
                if(worker.state == 'installed') {
                    worker.postMessage({action: 'skipWaiting'});
                    console.log('[trackInstalling] New service worker installed. Reloading...');
                    location.reload();
                }
            });
        }
        
        this.register = function() {
            if('serviceWorker' in navigator) {
                navigator.serviceWorker.register('../sw.js', {scope: './'})
                    .then(reg => {
                        if(reg.installing) {
                            trackInstalling(reg.installing);
                            return;
                        }

                        reg.addEventListener('updatefound', function() {
                            trackInstalling(reg.installing);
                        });

                    }).catch(function(err) {
                        console.log('Registration failed: ', err);
                    });
            }
        };
    }).call(swHelper);
} else {
    console.log('[ERROR]: Naming conflict -- "swHelper" is already defined.');
}