var _VERSION = 1;
var _DBNAME = 'drydockFields';
var _STORENAME = 'drydockData';

var apexDB = (function() {
    var aDB = {};
    var datastore = null;
    
    
    // open a connection to hte datastore
    aDB.open = function(callback) {

        var request = indexedDB.open(_DBNAME, _VERSION);
        
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            
            event.target.transaction.onerror = aDB.onerror;
            
            // Delete old datastores
            if(db.objectStoreNames.contains(_STORENAME)) {
                db.deleteObjectStore(_STORENAME);
            }
            
            // Create a new datastore
            var store = db.createObjectStore(_STORENAME, {
                keyPath: 'id'
            });
        };
        
        // Handle successful datastore access
        request.onsuccess = function(event) {
            datastore = event.target.result;
            callback();
        };
        
        // Handle errors when opening the datastore
        request.onerror = aDB.onerror;
    };
    
    aDB.fetchFields = function(callback) {
        var db = datastore;
        var transaction = db.transaction([_STORENAME], 'readwrite');
        var objStore = transaction.objectStore(_STORENAME);
        
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = objStore.openCursor(keyRange);
        
        var inputs = [];
        
        // Triggered for each item successfully returned from the database
        cursorRequest.onsuccess = function(event) {
            var result = event.target.result;
            
            // Make sure the result has a input item
            if(!!result == false) return;
            
            inputs.push(result.value);
            result.continue();
        };
        
        // Return the inputs list when transaction is completed
        transaction.oncomplete = function(event) {
            callback(inputs);
        };
        
        cursorRequest.onerror = aDB.onerror;
    };
    
    aDB.saveFieldData = function(field, callback) {
        var db = datastore;
        var transaction = db.transaction([_STORENAME], 'readwrite');
        var objStore = transaction.objectStore(_STORENAME);
        var inputId = field.id;
        var tagName = field.tagName.toLowerCase();
        var value = field.value
        
        // Create the data
        var data = {
            'id': inputId,
            'tagName': tagName,
            'value': value
        };

        // Save the data to IndexedDB
        var request = objStore.put(data);

        request.onsuccess = function(event) {
            callback(data);
        };

        request.onerror = aDB.onerror;
        
    };
    
    return aDB;
}());