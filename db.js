var todoDB = (function() {
	var tDB = {};
	var datastore = null;

	/**
	 ** Open a connection to the datastore
	 **/
	tDB.open = function(callback) {
		var version = 1;
		var request = indexedDB.open('todos', version);
		request.onupgradeneeded = function(e) {
			var db = e.target.result;

			e.target.transaction.onerror = tDB.onerror;

			// Delete the old datastore
			if (db.objectStoreNames.contains('todo')) {
				db.deleteObjectStore('todo');
			}

			// Create a new datastore
			var store = db.createObjectStore('todo', {
				keyPath: 'timestamp'
			});
		};

		// Handle successful datastore access
		request.onsuccess = function(e) {
			datastore = e.target.result;
			callback();
		};

		// Handle errors when opening the datastore
		request.onerror = tDB.onerror;
	};

	/**
	 ** Fetch all the todo items in the datastore
	 **/
	tDB.fetchTodos = function(callback) {
		var db = datastore;
		var transaction = db.transaction(['todo'], 'readwrite');
		var objStore = transaction.objectStore('todo');

		var keyRange = IDBKeyRange.lowerBound(0);
		var cursorRequest = objStore.openCursor(keyRange);

		var todos = [];

		transaction.oncomplete = function(e) {
			callback(todos);
		};

		// Triggered for each item successfully returned from the database
		cursorRequest.onsuccess = function(e) {
			var result = e.target.result;

			// Make sure the result has a todo item
			if(!!result == false) {
				return ;
			}

			todos.push(result.value);
			result.continue();
		};

		cursorRequest.onerror = tDB.onerror;
	};

	/**
	 ** Create a new todo item
	 **/
	 tDB.createTodo = function(text, callback) {
	 	var db = datastore;
	 	var transaction = db.transaction(['todo'], 'readwrite');
	 	var objStore = transaction.objectStore('todo');
	 	var timestamp = new Date().getTime();
	 	var todo = {
	 		'text': text,
	 		'timestamp': timestamp
	 	};
	 	var request = objStore.put(todo);

	 	request.onsuccess = function(e) {
	 		callback(todo);
	 	};

	 	request.onerror = tDB.onerror;
	 };

	/**
	 ** Delete a todo item
	 **/
	 tDB.deleteTodo = function(id, callback) {
	 	var db = datastore;
	 	var transaction = db.transaction(['todo'], 'readwrite');
	 	var objStore = transaction.objectStore('todo');
	 	var request = objStore.delete(id);

	 	request.onsuccess = function(e) {
	 		callback();
	 	};

	 	request.onerror = function(e) {
	 		console.log(e);
	 	};
	 };

	return tDB;
}());