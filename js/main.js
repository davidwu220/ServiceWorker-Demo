window.onload = function() {
    if(!navigator.serviceWorker) return;
    
    navigator.serviceWorker.register('./sw.js', {scope: './'}).then(function(reg) {
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
    
    
    // ask user permission to send notifications, then add the reg button
    new Promise(function(resolve, reject) {
        Notification.requestPermission(function(result) {
            if (result !== 'granted') {
                return reject(Error("Denied notification permission"));
            }

            resolve();
        });
    }).then(function() {
        
        // dynamically adding a button for registering
        var notiDiv = document.getElementById('notiDiv');
        var input = document.createElement('input');
        
        input.setAttribute('id', 'syncBtn');
        input.setAttribute('type', 'button');
        input.setAttribute('value', 'Register background sync!');
        notiDiv.appendChild(input);
        
        // listen to click event
        document.getElementById('syncBtn').addEventListener('click', function(event) {
            event.preventDefault();
            // Request a sync
            navigator.serviceWorker.ready.then(function(reg) {
                var item = 'outbox-' + Date.now();
                return reg.sync.register(item).then(function() {
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
    
    // ************** IndexedDB code starts here... **************
    apexDB.open(loadSavedFields);
    
    registerFieldListeners('form-input');
};

function registerFieldListeners(jquerySelector) {
    var formInput = $(jquerySelector);

    formInput.addEventListener('focusout', function(event) {
        var targetId = event.target.id;
        var targetTagName = event.target.tagName.toLowerCase();
        var targetValue;
        
        switch(targetTagName) {
            case 'select':
                targetValue = $('#' + targetId + '  option:selected').val();
                break;
            case 'input':
                targetValue = $('#' + targetId).val();
                break;
            case 'textField':
                // TODO...
            default:
                targetValue = '';
        }
        
        // save the value
        apexDB.saveFieldData(targetId, targetValue, function(data) {
            /* a refresh function */
            console.log('[IndexedDB saveFieldData] Data Saved: ', data);
        });
        
    });
}

function loadSavedFields() {
    apexDB.fetchFields(function(inputs) {
        inputs.forEach(function(input, index) {
            switch(input.tagName) {
            case 'select':
                $('#' + input.id + ' option[value=' + input.value + ']').attr('selected', true);
                break;
            case 'input':
                $('#' + input.id).val(input.value);
                break;
            case 'textField':
                // TODO...
            default:
                console.log('TagName not catched: ' + input.tagName);
            }
        });
    });
    
}

function trackInstalling(worker) {
    worker.addEventListener('statechange', function() {
        if(worker.state == 'installed') {
            worker.postMessage({action: 'skipWaiting'});
            console.log('[trackInstalling] statgechagne installed. reloading...');
            location.reload();
        }
    });
}
