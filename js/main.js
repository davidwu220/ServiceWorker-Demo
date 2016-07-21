window.onload = function () {
    if(!navigator.serviceWorker) return;
    
    navigator.serviceWorker.register('sw.js', {scope: './'}).then(function(reg) {
        if(reg.waiting) {
            console.log('[register-waiting] Update ready and waiting!!');
            return;
        }
        
        if(reg.installing) {
            trackInstalling(reg.installing);
            return;
        }
        
        reg.addEventListener('updatefound', function() {
            trackInstalling(reg.installing);
        });
        
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            location.reload();
        });
        
    }).catch(function(err) {
        console.log('Registration failed: ', err);
    });
    
    function trackInstalling(worker) {
        worker.addEventListener('statechange', function() {
            if(worker.state == 'installed') {
                location.reload();
                worker.postMessage({action: 'skipWaiting'});
//                document.getElementById('updateReady').style.display = 'block';
//                document.getElementById('refreshBtn').addEventListener('click', function() {
//                    worker.postMessage({action: 'skipWaiting'});
//                });
            }
        });
    }
}

