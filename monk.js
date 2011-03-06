$(document).ready(function() {
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

	function createTask(id) {
		id = (typeof(id) != "undefined") ? id : createTaskId();

		var task = $("#prototype > .task")
			.clone(deepWithDataAndEvents=true)
			.attr("id", id)
			.draggable({
				handle: "> *",
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
					saveTask(getParent($(ui.draggable)));
				}
			});
		return task;
	}

	function saveTask(task) {
		localStorage.setItem(task.attr("id"), JSON.stringify({
			title: task.find("> div > .task-title").text(),
			children: _.map(task.find("> .task-list > .task"), function(x){return $(x).attr("id")})
		}));
	}

	function removeTask(task) {
		_.each(task.find("> .task-list > .task"), function(child) { removeTask($(child))});
		localStorage.removeItem(task.attr("id"));
	}

	$("#task-add").keypress(function(e) {
		if (e.keyCode == 13 && $("#task-add").val().trim() != "") {
			var task = createTask().appendTo("#task-root-list");
			task.find("> div > .task-title")
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
		saveTask(getParent(task));
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
			.focus()
			.select();
	});

	$(".task-title-edit").focusout(function(e) {
		var editing = $(e.currentTarget);
		if (editing.hasClass(".task-title-moving"))
			return;
		var title = editing.siblings(".task-title");
		if (editing.val().trim() != "") {
				title.text(editing.val());
				saveTask(title.closest(".task"));
		}
		editing.hide();
		title.show();
	});

	var shiftDown = false;

	$(".task-title-edit").keydown(function(e) {
		switch (e.keyCode) {
		case 9:
			var title = $(e.currentTarget);
			var task = title.closest(".task");

			if (shiftDown) {
				var parentTask = getParent(task);

				if (!getParent(parentTask).size())
					return false;

				title.addClass(".task-title-moving");

				task.insertAfter(parentTask);
				saveTask(parentTask);
				saveTask(getParent(task));

				title.removeClass(".task-title-moving");
				title.focus().select();
			} else {
				var prev = task.prev(".task");

				if (!prev.size())
					return false;

				title.addClass(".task-title-moving");

				task.appendTo(prev.children(".task-list"));
				saveTask(prev);
				saveTask(getParent(prev));

				title.removeClass(".task-title-moving");
				title.focus().select();
			}
			return false;
		case 16:
			shiftDown = true;
			break;
		default:
		}
	});

	$(".task-title-edit").keyup(function(e) {
		switch (e.keyCode) {
		case 13:
			$(e.currentTarget).focusout();
			break;
		case 16:
			shiftDown = false;
			break;
		}
	});

	function loadTask(id) {
		var task = JSON.parse(localStorage.getItem(id));
		var element = createTask(id);
		element.find("> div > .task-title").text(task.title);
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

	$("#task-root-list > .task-add-child")
		.droppable({
			hoverClass: "ui-state-highlight",
			drop: function(e, ui) {
				// TODO: There should be a better way to do this
				$(ui.draggable).css({top:0,left:0});

				var oldParentTask = getParent($(ui.draggable));
				putTaskNextChild($(ui.draggable), $(this));
				saveTask(oldParentTask);
				saveTask(getParent($(ui.draggable)));
			}
		});

	$(".checkbox-checked,.checkbox-unchecked").click(function(e) {
		var $checkbox = $(e.currentTarget);
		if ($checkbox.hasClass("checkbox-unchecked")) {
			$(e.currentTarget)
				.removeClass("checkbox-unchecked")
				.addClass("checkbox-checked");
		} else if ($checkbox.hasClass("checkbox-checked")) {
			$(e.currentTarget)
				.removeClass("checkbox-checked")
				.addClass("checkbox-unchecked");
		}
	});

	$(".delete").click(function(e) {
		var task = $(e.currentTarget).closest(".task");
		var parentTask = getParent(task);
		removeTask(task);
		task.remove();
		saveTask(parentTask);
	});
});

