window.onload = function() {
	// Open connection to the database
	todoDB.open(refreshTodos);
    
    // Load the service worker
	installSW();

	var newTodoForm = document.getElementById('new-todo-form');
	var newTodoInput = document.getElementById('new-todo');

	// Handle new todo item form submissions
	newTodoForm.onsubmit = function() {
		// Get the todo text
		var text = newTodoInput.value;

		// Check to make sure the text is not blank (or just spaces)
		if (text.replace(/ /g, '') != '') {
			// Create the todo item
			todoDB.createTodo(text, function(todo) {
				// Refresh the UI
				refreshTodos();
			});
		}

		// Reset the input field
		newTodoInput.value = '';

		// Don't send the form
		return false;
	};
};

// update the list of todo items
function refreshTodos() {
	todoDB.fetchTodos(function(todos) {
		var todoList = document.getElementById('todo-items');
		todoList.innerHTML = '';

		for (var i = 0; i < todos.length; i++) {
			// Read the todo items backwards (most recent first)
			var todo = todos[(todos.length - 1 - i)];

			var li = document.createElement('li');
			li.id = 'todo-' + todo.timestamp;
			var checkbox = document.createElement('input');
			checkbox.type = "checkbox";
			checkbox.className = "todo-checkbox";
			checkbox.setAttribute("data-id", todo.timestamp);

			li.appendChild(checkbox);

			var span = document.createElement('span');
			span.innerHTML = todo.text;

			li.appendChild(span);

			todoList.appendChild(li);

			// Setup an event listener for the checkbox
			checkbox.addEventListener('click', function(e) {
				var id = parseInt(e.target.getAttribute('data-id'));

				todoDB.deleteTodo(id, refreshTodos);
			});
		}
	});
}

// registers the serviceworker with the browser.
function installSW() {
	if (navigator.serviceWorker) {
		console.log("browser supports service workers");
		if (navigator.serviceWorker.controller) {
			console.log(navigator.serviceWorker.controller.scriptURL + ' (onload)', 'controller');
			console.log("service worker already active");
		} else {
			navigator.serviceWorker.register("sw.js", {scope : "null"}).then(
				function(reg){
					console.log(reg.scope, "registered");
				}
			).catch(
				function(error) {
					console.log(error);
				}
			)
		}
	} else {
		// TODO: appcache fallback
		console.log("browser doesn't support service workers");
	}
}
