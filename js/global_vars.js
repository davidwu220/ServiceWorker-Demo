/**
 * We put all global variables into one file for
 * easy maintenance in the future.
 * 
 * Variables with '_' prefix indicates that they are used within
 * the offline solution; variables without '_' indicates that they
 * are used externally (i.e. APEX).
 *
 * NOTE: Because service worker loads before everything else,
 * the global bariables need to be declaired in sw.js.
 **/

/**
 * main.js global variables
 **/
// Public
var FIELDS_TO_SAVE_ID = '#t_Body_content';
var HIGHLIGHT_THIS_ID = '#status';
var TIME_LAST_SAVED_ID = '#timeLastSaved';
var DISABLE_THESE_ID = [
    '#a',
    '#b'
];
//jQuery UI seems to be a bit different than the rest of JQuery - omit # before tag
var MODAL_DIALOG_ID = 'local_changes_dialog';

// Private
var _NETWORK_STATUS_ID = '#networkStatus';
let _pageNumRegex = new RegExp(/f\?p=\w+:(\w+):/, '');
var _PREFIX = "P" + _pageNumRegex.exec(document.URL)[1];


/**
 * ServiceWorker (sw.js) global variables
 *
 * See NOTE abave.
 **/

/**
 * IndexedDB (db.js) global variables
 **/
// Public
// Important: set PRIMARY_KEY_FIELD_ID per page!

// Private
var _DB_VERSION = 1;
var _DB_NAME = 'shouldBeOverridden';
var _STORE_NAME = 'drydockFieldData';


