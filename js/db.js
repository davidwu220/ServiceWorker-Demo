var _VERSION = 1;
var _DBNAME = 'drydockFields';
var _STORENAME = 'drydockData';

var apexDB = (function() {
    var aDB = {};
    var datastore = null;
    
    /**
     * Converts a date object into a string
     * using toLocaleString.
     */
    function dateTime(date) {
        options = {
            "year":"2-digit",
            "month":"numeric",
            "day":"2-digit",
            "hour":"2-digit",
            "minute":"2-digit",
            "second":"2-digit"
        };
        return date.toLocaleString("en-US", options);
    }
    
    /** 
     * Open a connection to the datastore.
     */
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

    aDB.clear = function() {
        indexedDB.deleteDatabase(_DBNAME);
        aDB.open();
    }
    
    /**
     * Return all field data objects stored in the IndexedDB.
     */
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

    aDB.searchFields = function(prefix, callback) {
        var transaction = db.transaction([_STORENAME], 'readwrite');
        var index = transaction.objectStore(_STORENAME).name("id");
        var cursorRequest = index.openCursor();
        var fields = [];

        cursorRequest.onsuccess = function(event){
            var result = event.target.result;
            if (result.indexof(prefix) === 0){
                fields.push(result.value);
            }
            
            if (!!result == false) return;

            result.continue();
        }
        
        transaction.oncomplete = function(event) {
            callback(inputs);
        }
        
        cursorRequest.onerror = aDB.onerrror;
    }

    /**
     * Save this field's id, name, and value in the IndexedDB.
     */
    aDB.saveFieldData = function(field, callback) {
        var db = datastore;
        var transaction = db.transaction([_STORENAME], 'readwrite');
        var objStore = transaction.objectStore(_STORENAME);
        
        // Create the data
        var data = {
            'id': field.id,
            'tagName': field.tagName.toLowerCase(),
            'value': field.value
        };

        // Save the data to IndexedDB
        var request = objStore.put(data);

        request.onsuccess = function(event) {
            callback(data);
        };

        request.onerror = aDB.onerror;
        
    };
    
    /**
     * Generate a timestamp data object for the db.
     */
    aDB.timeStamp = function(idKey) {
    	var timeStamp = dateTime(new Date());
    	aDB.saveFieldData({
    		id: idKey,
    		tagName: 'timestamp',
    		value: timeStamp
    	}, function (data) {});
    	
    	return timeStamp;
    }
    
    return aDB;
}());
