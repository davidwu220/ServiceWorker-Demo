window.onload = function() {
    if(!navigator.serviceWorker) return;
    
    navigator.serviceWorker.register('../sw.js', {scope: './'}).then(function(reg) {
        if(reg.waiting) {
            console.log('[register-waiting] Update is ready and waiting!!');
            return;
        }
        
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
    
    function trackInstalling(worker) {
        worker.addEventListener('statechange', function() {
            if(worker.state == 'installed') {
                worker.postMessage({action: 'skipWaiting'});
                console.log('[trackInstalling] SW Statgechagne: installed. reloading...');
                location.reload();
//                document.getElementById('updateReady').style.display = 'block';
//                document.getElementById('refreshBtn').addEventListener('click', function() {
//                    worker.postMessage({action: 'skipWaiting'});
//                });
            }
        });
    }
    
}

