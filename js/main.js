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
    
    registerFieldListeners('#form-input');
};


/**
 * Register appropriate event listeners for each input field in the div.
 * Currently, assigns a focusout listener for each field.
 * @param div [String] a jQuery selector string
 */
function registerFieldListeners(div) {
    var formInputs = getFormInputs(div);
    console.log("registerFieldListeners: ", formInputs.toArray());
    formInputs.each( function(){
        var field = $(this);
        registerSaveOnFocusOut(this);
    });
}

/**
 * Return field inputs that we want to capture.
 * @param div [String] a jQuery selector string
 */
function getFormInputs(div) {
    return $(jQuerySelector).find( ":input" ).not( ":submit" ).not( ":reset" ).not( ":button" ).not( ":file" ).not( ":password" ).not( ":disabled" ).not( "[readonly]" );

}

/**
 * Registers this individual field to save into apexDB on focusout.
 */
function registerSaveOnFocusOut(field) {
    $(field).on('focusout', function() { 
        apexDB.saveFieldData(field.id, field.value, function(data) {
            // [> a refresh function <]
            console.log('[IndexedDB saveFieldData] Data Saved: ', data);
        });
        
    });
    
};

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
