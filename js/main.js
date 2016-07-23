window.onload = function() {
    if(!navigator.serviceWorker) return;
    
    navigator.serviceWorker.register('/sw.js', {scope: './'}).then(function(reg) {
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
    
    // ask user permission to send notifications, then add the reg button
    new Promise(function(resolve, reject) {
        Notification.requestPermission(function(result) {
            if (result !== 'granted') {
                return reject(Error("Denied notification permission"));
            }

            resolve();
        });
    }).then(function() {
        var notiDiv = document.getElementById('notiDiv');
        var input = document.createElement('input');
        
        input.setAttribute('id', 'syncBtn');
        input.setAttribute('type', 'button');
        input.setAttribute('value', 'Register background sync!');
        notiDiv.appendChild(input);

        document.getElementById('syncBtn').addEventListener('click', function(event) {
            event.preventDefault();
            // Request a sync
            navigator.serviceWorker.ready.then(function(reg) {
                var item = 'outbox-' + Date.now();
                reg.sync.register(item).then(function() {
                    // registration succeeded
                    var log = document.createElement('p');
                    log.textContent = item + ' registered!';
                    notiDiv.appendChild(log);
                }, function() {
                    // registration failed
                    var log = document.createElement('p');
                    log.textContent = 'Registration failed';
                    notiDiv.appendChild(log);
                });
            });
        });
    });
}

