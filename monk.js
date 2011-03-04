$(document).ready(function() {
	// TODO: a library of functions could possibly be nice
	// TODO: we can actually have multiple classes per html element
	//       (separate by spaces)

	function putTaskNextChild(task, target) {
		task.insertAfter(target.closest(".task-list > *"))
			.show();
	}

	function createTaskId() {
		var id;
		if (localStorage.getItem("task-id") == null)
			id = 1;
		else
			id = 1 + parseInt(localStorage.getItem("task-id"));
		localStorage.setItem("task-id", id);
		return "task-" + id;
	}


	function getParent(task) {
		return task.parents(".task").first();
	}

	function saveParent(task) {
		saveTask(getParent(task));
	}

	function createTask(id) {
		id = (typeof(id) != "undefined") ? id : createTaskId();

		var task = $("#prototype > .task")
			.clone(deepWithDataAndEvents=true)
			.attr("id", id)
			.draggable({
				handle: "> .task-title",
				revert: "invalid",
				revertDuration: 100,
			});
		task.find(".task-add-child,.task-add-next")
			.droppable({
				hoverClass: "ui-state-highlight",
				drop: function(e, ui) {
					// TODO: There should be a better way to do this
					$(ui.draggable).css({top:0,left:0});

					var oldParentTask = getParent($(ui.draggable));
					putTaskNextChild($(ui.draggable), $(this));
					saveTask(oldParentTask);
					saveParent($(ui.draggable));
				}
			});
		return task;
	}

	function saveTask(task) {
		localStorage.setItem(task.attr("id"), JSON.stringify({
			title: task.children(".task-title").text(),
			children: _.map(task.find("> .task-list > .task"), function(x){return $(x).attr("id")})
		}));
	}

	function removeTask(task) {
		localStorage.removeItem(task.attr("id"));
		// TODO: remove subtasks
	}

	$("#task-add").keypress(function(e) {
		if (e.keyCode == 13 && $("#task-add").val().trim() != "") {
			var task = createTask().appendTo("#task-root-list");
			task.find(".task-title")
					.text($("#task-add").val())
			task.show();
			saveTask(task);
			saveTask($("#task-root"));
			$("#task-add").val("");
		}
	});

	$(".task-close").click(function(e) {
		var task = $(e.currentTarget).closest(".task");
		var parentTask = getParent(task);
		removeTask(task);
		task.remove();
		saveTask(parentTask);
	});

	$(".task-add-child,.task-add-next").click(function(e) {
		var task = createTask();
		putTaskNextChild(task, $(e.currentTarget));
		saveParent(task);
		saveTask(task);
	});

	// TODO: make this work with drag/drop
	// we want this to be either on mouseup or as a drag/drop callback?
	// only have a single instance that moves around?
	// drag/drop needs just a little bit of snap
	$(".task-title").click(function(e) {
		var title = $(e.currentTarget);
		title.hide();
		title.siblings(".task-title-edit")
			.val(title.text())
			.show()
			.focus();
	});

	$(".task-title-edit").focusout(function(e) {
		var title = $(e.currentTarget);
		title.hide();
		title.siblings(".task-title")
			.text(title.val())
			.show();
		saveTask(title.closest(".task"));
	});

	function loadTask(id) {
		var task = JSON.parse(localStorage.getItem(id));
		var element = createTask(id);
		element.find(".task-title").text(task.title);
		_.each(task.children, function(child) {
			loadTask(child).appendTo(element.find("> .task-list"));
		});
		return element;
	}

	var root = JSON.parse(localStorage.getItem("task-root"));
	if (root != null) {
		_.each(root.children, function(child) {
			loadTask(child).appendTo($("#task-root-list"));
		});
	}
});

