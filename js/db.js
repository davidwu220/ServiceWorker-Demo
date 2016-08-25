if(typeof apexDB === 'undefined') {
    var apexDB = {};
    
    (function() {
        var database = null;

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
         * Open a connection to the database.
         */
        this.open = function(callback) {

            var request = indexedDB.open(_DB_NAME, _DB_VERSION);

            request.onupgradeneeded = function(event) {
                var db = event.target.result;

                event.target.transaction.onerror = this.onerror;

                // Delete old datastores
                if(db.objectStoreNames.contains(_STORE_NAME)) {
                    db.deleteObjectStore(_STORE_NAME);
                }

                // Create a new datastore
                var store = db.createObjectStore(_STORE_NAME, {
                    keyPath: 'id'
                });
            };

            // Handle successful database access
            request.onsuccess = function(event) {
                database = event.target.result;
                if(callback) {
                    callback();
                }
            };

            // Handle errors when opening the database
            request.onerror = this.onerror;
        };

        /**
         * Clears the data in the datastore _STORE_NAME.
         */
        this.clear = function() {
            this.open(() => {
                var transaction = database.transaction([_STORE_NAME], 'readwrite');
                var objectStore = transaction.objectStore(_STORE_NAME);
                var objectStoreRequest = objectStore.clear();
            });
        };

        /**
         * Return all field data objects stored in the IndexedDB.
         */
        this.fetchFields = function(callback) {
            var db = database;
            var transaction = db.transaction([_STORE_NAME], 'readwrite');
            var objStore = transaction.objectStore(_STORE_NAME);

            var keyRange = IDBKeyRange.lowerBound(0);
            var cursorRequest = objStore.openCursor(keyRange);

            var inputs = [];

            // Triggered for each item successfully returned from the datastore
            cursorRequest.onsuccess = function(event) {
                var result = event.target.result;

                // Make sure the result has a input item
                if(!!result == false) return;

                inputs.push(result.value);
                result.continue();
            };

            // Return the inputs list when transaction is completed
            transaction.oncomplete = function(event) {
                if(callback) {
                    callback(inputs);
                }
            };

            cursorRequest.onerror = this.onerror;
        };

        this.searchFields = function(prefix, callback) {
            var transaction = db.transaction([_STORE_NAME], 'readwrite');
            var index = transaction.objectStore(_STORE_NAME).name("id");
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
                if(callback) {
                    callback();
                }
            }

            cursorRequest.onerror = this.onerrror;
        };

        /**
         * Save this field's id, name, and value in the IndexedDB.
         */
        this.saveFieldData = function(field, callback) {
            var db = database;
            var transaction = db.transaction([_STORE_NAME], 'readwrite');
            var objStore = transaction.objectStore(_STORE_NAME);

            // Create the data
            var data = {
                'id': field.id,
                'tagName': field.tagName.toLowerCase(),
                'value': field.value
            };

            // Save the data to IndexedDB
            var request = objStore.put(data);

            request.onsuccess = function(event) {
                if(callback) {
                    callback();
                }
            };

            request.onerror = this.onerror;

        };

        /**
         * Generate a timestamp data object for the db.
         */
        this.timeStamp = function(idKey) {
            var timeStamp = dateTime(new Date());
            this.saveFieldData({
                id: idKey,
                tagName: 'timestamp',
                value: timeStamp
            }, function (data) {});

            return timeStamp;
        }
    }).call(apexDB);
} else {
    console.log('[ERROR]: Naming conflict -- "apexDB" is already defined.');
}