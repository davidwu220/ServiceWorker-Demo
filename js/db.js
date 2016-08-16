var _VERSION = 1;
var _DBNAME = 'drydockFields';
var _STORENAME = 'drydockData';

var apexDB = (function() {
    var aDB = {};
    var datastore = null;
    
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
    
    aDB.timeStamp = function() {
    	var timeStamp = dateTime(new Date());
    	aDB.saveFieldData({
    		id: 'timestamp',
    		tagName: 'timestamp',
    		value: timeStamp
    	}, function (data) {});
    	
    	return timeStamp;
    }
    
    return aDB;
}());
