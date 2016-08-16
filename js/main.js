/**
 * Portions of this script were based off of https://github.com/simsalabim/sisyphus
 * Proper attribution is left as an exercise for the maintainer.
 */

var timeLastSaved = '';

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
    
    
    // ask user permission to send notifications, then add the reg button
    new Promise(function(resolve, reject) {
        Notification.requestPermission(function(result) {
            if (result !== 'granted') {
                return reject(Error("Denied notification permission"));
            }

            resolve();
        });
    }).then(function() {
        
        // //dynamically adding a button for registering
        // var notiDiv = document.getElementById('notiDiv');
        // var input = document.createElement('input');
        
        // input.setAttribute('id', 'syncBtn');
        // input.setAttribute('type', 'button');
        // input.setAttribute('value', 'Register background sync!');
        // notiDiv.appendChild(input);
        
        // // listen to click event
        // document.getElementById('syncBtn').addEventListener('click', function(event) {
        //     event.preventDefault();
        //     // Request a sync
        //     navigator.serviceWorker.ready.then(function(reg) {
        //         var item = 'outbox-' + Date.now();
        //         return reg.sync.register(item).then(function() {
        //             // registration succeeded
        //             var log = document.createElement('p');
        //             log.textContent = item + ' registered!';
        //             notiDiv.appendChild(log);
        //         }, function() {
        //             // registration failed
        //             var log = document.createElement('p');
        //             log.textContent = 'Registration failed';
        //             notiDiv.appendChild(log);
        //         });
        //     });
        // });
    });
    
    // ************** IndexedDB code starts here... **************
    idHiddenFields('#t_Body_content');
    apexDB.open(loadSavedFields);
    saveAllInterval('#t_Body_content', 15000);
    //registerFieldListeners('#form-input');
};

/**
 * Triggers the element's highlight animation.
 * @param tag [tag] an html element
 */
function highlightThis(tag) {
	$(tag).addClass('highlight');
	$(tag).removeClass('highlight', {
		duration: 2000,
		easing: 'easeInQuint'
	});
}

/**
 * Find out if we're using CKEditor.
 */
function CKEditorExists() {
    return typeof CKEDITOR !== "undefined";
}

/**
 * Assigns ids to hidden fields that don't have one
 * within the provided div.
 * @param div [String] a jQuery selector string
 */
function idHiddenFields(div) {
    var index = 0;
    var formInputs = getFormInputs(div);
    formInputs.each(function(){
        if(this.id == '') {
            this.id = 'p_arg_' + index;
            index += 1;
        }
    });
}

/**
 * Saves all form inputs in the div on an interval.
 * @param div [String] a jQuery selector string
 * @param interval [int] in milliseconds
 */

function saveAllInterval(div, interval){
    var formInputs = getFormInputs(div);
    setInterval(function(){
        formInputs.each(function(){
            saveInputField(this);
        });

        timeLastSaved = apexDB.timeStamp();
        $('#timeLastSaved').html(timeLastSaved);
        highlightThis('#status');
    }, interval);
}

/**
 * [Public] function used by APEX page
 * elements to trigger input field storage.
 */
var SAVENOW = function() {
    let fi = getFormInputs('#t_Body_content');
    fi.each(function() {
        saveInputField(this);
    });

    timeLastSaved = apexDB.timeStamp();
    $('#timeLastSaved').html(timeLastSaved);
    highlightThis('#status');
}

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
        registerSaveOnEvent(this, 'input');
    });
}

/**
 * Return field inputs that we want to capture.
 * @param div [String] a jQuery selector string
 */
function getFormInputs(div) {
    return $(div).find( ":input" ).not( ":submit" ).not( ":reset" ).not( ":button" ).not( ":file" ).not( ":password" ).not( ":disabled" ).not( "[readonly]" );

}

/**
 * Registers this individual field to save into apexDB when the specified
 * event type occurs.
 *
 * @param field [DOMObject] a field name
 * @param eventType [String] a js event type
 */
function registerSaveOnEvent(field, eventType) {
    $(field).on(eventType, saveInputField(field));
}

/**
 * Writes this field to apexDB.
 * If the field (usually a textarea) has a corresponding CKEditor,
 * store its data in this field.
 * @param field [input] an input field
 */
function saveInputField(field) {
    if (CKEditorExists()) {
        var editor = CKEDITOR.instances[field.id];
        if (editor) {
            field.value = editor.getData();
        }
    }
    apexDB.saveFieldData(field, function(data) {});
}

/**
 * Restores all fields on this page that were previously stored
 * in apexDB.
 */
function loadSavedFields() {
    apexDB.fetchFields(function(inputs) {
        inputs.forEach(function(input, index) {
            switch(input.tagName) {
            case 'timestamp':
            	$('#timeLastSaved').html(input.value);
            	break;
            case 'select':
                if (input.value) {
                    $('#' + input.id + ' option[value=' + input.value + ']').attr('selected', true);
                }
                break;
            case 'input':
                $('#' + input.id).val(input.value);
                break;
            case 'textarea':
                if (CKEditorExists()) {
                    var editor = CKEDITOR.instances[input.id];
                    console.log(editor);
                    if (editor){
                        editor.setData(input.value);
                        return;
                   }
                }
                $('#' + input.id).val(input.value);
            default:
                console.log('TagName not catched: ' + input.tagName);
            }
        });
    });
    
}

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
            console.log('[trackInstalling] statgechagne installed. reloading...');
            location.reload();
        }
    });
}
