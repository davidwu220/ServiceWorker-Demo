/**
 * Portions of this script were based off of https://github.com/simsalabim/sisyphus
 * Proper attribution is left as an exercise for the maintainer.
 */

// Important! Field saving will not run if PRIMARY_KEY_FIELD_ID is not set!

let TIMESTAMP = '';
let FORM_INPUTS = null;
let SAVE_INTERVAL = 5000;

window.onload = function() {
    // ************** ServiceWorker code starts here... **************
    swHelper.register();
    
    // ************** IndexedDB code starts here... **************
    if (typeof(PRIMARY_KEY_FIELD_ID) != 'undefined') {
        _DB_NAME = _PREFIX + '_drydockFields_' + $("#" + PRIMARY_KEY_FIELD_ID).val();
        FORM_INPUTS = getFormInputs(FIELDS_TO_SAVE_ID);

        //form loading and restore
        apexDB.open(checkIfOpenDialog);

        // Check if the origin is reachable every 60 sec.
        networkTest.hostReachable(networkTest.updateNetworkStatus);
        let uns = setInterval(() => {
            networkTest.hostReachable(networkTest.updateNetworkStatus);
        }, 60000);
        
        // Add listeners to network change
        networkTest.listenToNetworkChange(networkTest.updateNetworkStatus);
    }
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
        
        if (cflag) {
            saveAllInterval(FIELDS_TO_SAVE_ID, SAVE_INTERVAL);
        } else {
        
            openModal(MODAL_DIALOG_ID);
        }
    });
}

/**
 * [Public] function used by APEX page
 * elements to trigger input field storage.
 */
var APEX_SAVEALL = function() {
    if(FORM_INPUTS) {
        FORM_INPUTS.each(function() {
            saveInputField(this);
        });

        TIMESTAMP = apexDB.timeStamp(_PREFIX + "_TIMESTAMP");
        $(TIME_LAST_SAVED_ID).html(TIMESTAMP);
        highlightThis(HIGHLIGHT_THIS_ID);
    }
}

/**
 * [Public] function used to trigger field
 * saves from within APEX.
 * @param daobject [JS Object] an APEX dynamic action object
 */
var APEX_SAVEFIELD = function(daobject) {
    if (daobject.browserEvent != "load") {
        highlightThis(HIGHLIGHT_THIS_ID);
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
    saveAllInterval(FIELDS_TO_SAVE_ID, SAVE_INTERVAL);
}

/**
 * [Public] Delete the current IndexedDB and any fields in
 * it, then create a new database that holds the current
 * field data. Intended to be run through an APEX dynamic action.
 */
var APEX_DISCARDALL = function() {
    apexDB.clear();
    saveAllInterval(FIELDS_TO_SAVE_ID, SAVE_INTERVAL);
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
 * Saves all form inputs in the div on an interval.
 * @param div [String] a jQuery selector string
 * @param interval [int] in milliseconds
 */

function saveAllInterval(div, interval){
    FORM_INPUTS = getFormInputs(div);
    setInterval(APEX_SAVEALL, interval);
}

/**
 * Return field inputs that we want to capture.
 * @param div [String] a jQuery selector string
 */
function getFormInputs(div) {
    return $(div).find( ":input" ).not("[type='hidden']").not( ":submit" ).not( ":reset" ).not( ":button" ).not( ":file" ).not( ":password" ).not( ":disabled" ).not( "[readonly]" );
    
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
            	$(TIME_LAST_SAVED_ID).html(input.value);
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
