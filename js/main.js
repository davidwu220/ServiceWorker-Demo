/**
 * Portions of this script were based off of https://github.com/simsalabim/sisyphus
 * Proper attribution is left as an exercise for the maintainer.
 */

var _FIELDSTOSAVE = '#t_Body_content';
var timeLastSaved = '';
var formInputs = null;
var pageNumRegex = new RegExp(/f\?p=\w+:(\w+):/, '');
var _PREFIX = "P" + pageNumRegex.exec(document.URL)[1];
var _MODAL_DIALOG = 'local_changes_dialog';

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

    // ************** IndexedDB code starts here... **************
    formInputs = getFormInputs(_FIELDSTOSAVE);
    //idHiddenFields(_FIELDSTOSAVE);
    //registerFieldListeners('#form-input');
    //form loading and restore handled with APEX dynamic actions
    apexDB.open(checkIfOpenDialog);

    // Check if the origin is reachable every 60 sec.
    let uns = setInterval(function() {
        networkTest.hostReachable(updateNetworkStatus);
    }, 60000);
    
    // Add listeners to network change
    networkTest.listenToNetworkChange(updateNetworkStatus);
};


/**
 * Compares the values saved in apexDB with the values currently on the page.
 * Calls the callback if any of the values differ, or if the DB contains no items.
 *
 * @param callback a function
 */
function checkIfOpenDialog(callback) {
    apexDB.fetchFields(function(inputs) {
        var cflag = true;
        inputs.forEach(function(input,index) {
            switch(input.tagName) {
                case 'select':
                case 'input':
                case 'textarea':
                    if (input.value != $('#' + input.id).val()) {
                        cflag = false;
                    }
                    //console.log(index, input.value == $('#' + input.id).val());
                break;
            }
        });
        
        if (!cflag) {
            openModal(_MODAL_DIALOG);
        }
    });
}

/**
 * Callback function for updating on/offline status text
 */
var updateNetworkStatus = function(status) {
    if(status) {
        $('#networkStatus').html('ONLINE');
    } else {
        $('#networkStatus').html('OFFLINE');
    }
}

/**
 * [Public] function used by APEX page
 * elements to trigger input field storage.
 */
var APEX_SAVEALL = function() {
    if(formInputs) {
        formInputs.each(function() {
            saveInputField(this);
        });

        timeLastSaved = apexDB.timeStamp(_PREFIX + "_TIMESTAMP");
        $('#timeLastSaved').html(timeLastSaved);
        highlightThis('#status');
    }
}

/**
 * [Public] function used to trigger field
 * saves from within APEX.
 * @param daobject [JS Object] an APEX dynamic action object
 */
var APEX_SAVEFIELD = function(daobject) {
    if (daobject.browserEvent != "load") {
        highlightThis('#status');
        saveInputField(daobject.browserEvent.target);
    }
}

/**
 * [Public] Loads all fields from IndexedDB. Intended to be
 * run using an APEX dynamic action, for example a
 * button click.
 */
var APEX_LOADALL = function() {
    apexDB.open(loadSavedFields);
    saveAllInterval(_FIELDSTOSAVE, 15000);
}

/**
 * [Public] Delete the current IndexedDB and any fields in
 * it, then create a new database that holds the current
 * field data. Intended to be run through an APEX dynamic action.
 */
var APEX_DISCARDALL = function() {
    apexDB.clear();
}


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
 * Uses pageNumRegex to find the current APEX page.
 * @param div [String] a jQuery selector string
 */
function idHiddenFields(div) {
    var index = 0;
    var formInputs = getFormInputs(div);
    formInputs.each(function(){
        if(this.id == '') {
            this.id = _PREFIX + '_ARG_' + index;
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
    formInputs = getFormInputs(div);
    setInterval(APEX_SAVEALL, interval);
}

/**
 * Register appropriate event listeners for each input field in the div.
 * Currently, assigns a focusout listener for each field.
 * @param div [String] a jQuery selector string
 */
//function registerFieldListeners(div) {
    //var formInputs = getFormInputs(div);
    //console.log("registerFieldListeners: ", formInputs.toArray());
    //formInputs.each( function(){
        //var field = $(this);
        //registerSaveOnEvent(this, 'input');
    //});
//}

/**
 * Return field inputs that we want to capture.
 * @param div [String] a jQuery selector string
 */
function getFormInputs(div) {
    return $(div).find( ":input" ).not("[type='hidden']").not( ":submit" ).not( ":reset" ).not( ":button" ).not( ":file" ).not( ":password" ).not( ":disabled" ).not( "[readonly]" );
    
}

/**
 * Registers this individual field to save into apexDB when the specified
 * event type occurs.
 *
 * @param field [DOMObject] a field name
 * @param eventType [String] a js event type
 */
//function registerSaveOnEvent(field, eventType) {
    //$(field).on(eventType, saveInputField(field));
//}

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
                    //console.log(editor);
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
