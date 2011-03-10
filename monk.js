$(document).ready(function() {
	function Task (element) {
		if (_.isUndefined(element)) {
			this.element = Task.create();
		} else {
			this.element = element;
		}
	}

	// TODO: state: moving, creating, none
	Task.prototype = {
		insertAfter: function(task) {
			this.element.insertAfter(task.element.parent(".task-list"));
			// TODO: update localStorage
		},

		insertChild: function(task) {
			this.element.appendTo(task.element.children(".task-list"));
		},

		remove: function() {
			function helper(x) {
				_.each(x.children(), helper);
				localStorage.removeItem(x.id());
			}

			var parent = this.parent();
			helper(this);
			parent.save();
		},

		children: function() {
			// TODO: make simpler
			return _.map(this.element.find("> .task-list > .task"), function(x) {
				return new Task($(x));
			});
		},

		parent: function() {
			return new Task(this.element.parents(".task").first());
		},

		// TODO: simpler attribute mechanism
		title: function(new_title) {
			if (_.isUndefined(new_title)) {
				return this.element.find("> div > .task-title").text();
			} else {
				this.element.find("> div > .task-title").text(new_title);
				this.save();
			}
		},

		id: function(new_id) {
			if (_.isUndefined(new_id)) {
				return this.element.attr("id");
			} else {
				this.element.attr("id", new_id);
				this.save();
			}
		},

		checked: function(new_checked) {
			if (_.isUndefined(new_checked)) {
				return this.element.attr("id");
			} else {
				this.element.attr("id", new_checked);
				this.save();
			}
		},

		stringify: function() {
			return JSON.stringify({
				id: this.id(),
				title: this.title(),
				checked: this.checked(),
				// TODO: Task.prototype.id?
				children: _.map(this.children(), Task.prototype.id)
			});
		},

		isRoot: function() {
		},

		save: function() {
			localStorage.setItem(this.id(), this.stringify());
		}
	};

	Task.load = function(id) {
		return Task.initialize(JSON.parse(localStorage.getItem(id)));
	}

	Task.initialize = function(o) {
		var task = new Task();

		// TODO: better mechanism for defaults?
		o.id = _.isUndefined(o.id) ? Task.createId() : o.id;
		o.title = _.isUndefined(o.title) ? "" : o.title;
		o.checked = _.isUndefined(o.checked) ? false : o.checked;
		o.children = _.isUndefined(o.children) ? [] : o.title;

		task.id(o.id);
		task.title(o.title);
		task.checked(o.checked);

		_.each(o.children, function(child) {
			// TODO: Task.load(child).insertChild(task);
		});
		return task;
	}

	Task.createId = function() {
		var id;
		if (localStorage.getItem("task-id") == null)
			id = 1;
		else
			id = 1 + parseInt(localStorage.getItem("task-id"));
		localStorage.setItem("task-id", id);
		return "task-" + id;
	}

	Task.get = function(selector) {
		return new Task(selector.closest(".task"));
	}

	Task.insertChildDrop = {
		hoverClass: "ui-state-highlight",
		drop : function(e, ui) {
			var $task = $(ui.draggable);
			$task.css({top:0,left:0});

			Task.get($task).insertChild($(this));
		}
	};

	Task.insertAfterDrop = {
		hoverClass: "ui-state-highlight",
		drop : function(e, ui) {
			var $task = $(ui.draggable);
			$task.css({top:0,left:0});

			Task.get($task).insertAfter($(this));
		}
	};

	Task.create = function(id) {
		id = _.isUndefined(id) ? id : createTaskId();

		var $task = $("#prototype > .task")
			.clone(deepWithDataAndEvents=true)
			.draggable({
				handle: "> *",
				revert: "invalid",
				revertDuration: 100,
			});

		$task.find(".task-insert-child")
			.droppable(Task.insertChildDrop);

		$task.find(".task-insert-after")
			.droppable(Task.insertAfterDrop);

		return $task;
	}

	// ******************************************************************

	$("#task-add").keypress(function(e) {
		if (e.keyCode == 13 && $("#task-add").val().trim() != "") {
			var task = Task.initialize({title: $("#task-add").val()})
				.insertChild(Task.get($("#task-root")));
			$("#task-add").val("");
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
		var task = Task.get($(e.currentTarget));
		task.remove();
	});

	$(".task-insert-child").click(function(e) {
		new Task().insertChild(Task.get($(e.currentTarget)));
	});

	$(".task-insert-after").click(function(e) {
		new Task().insertAfter(Task.get($(e.currentTarget)));
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
		var $editing = $(e.currentTarget);
		var $title = $editing.siblings(".task-title");

		// TODO: keep the state of the item, if it's currently being created
		// destroy it if it's empty
		if ($editing.hasClass("task-title-moving"))
			return;
		if ($editing.val().trim() != "") {
			$title.text($editing.val());
			Task.get($title).save();
		}
		$editing.hide();
		$title.show();
	});

	var shiftDown = false;

	$(".task-title-edit").keydown(function(e) {
		switch (e.keyCode) {
		case 9:
			var $title = $(e.currentTarget);
			var task = Task.get($title);

			if (shiftDown) {
				var parent = task.parent();

				if (!parent.isRoot())
					return false;

				$title.addClass("task-title-moving");

				task.insertAfter(parent);
				parent.save();
				task.parent().save();

				$title.removeClass("task-title-moving");
				$title.focus().select();
			} else {
				var prev = task.prev();

				if (!prev.size())
					return false;

				$title.addClass("task-title-moving");

				task.insertAfter(prev.find("> div > .task-list"));
				prev.save();
				getParent(prev).save();

				$title.removeClass("task-title-moving");
				$title.focus().select();
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

	var root = JSON.parse(localStorage.getItem("task-root"));
	if (root != null) {
		_.each(root.children, function(child) {
			Task.get($("#task-root")).insertChild(Task.load(child));
		});
	}
});

