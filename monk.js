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
			if (this.element.parent().size() > 0) {
				var parent = this.parent();
				this.element.detach();
				parent.save();
			}
			this.element.insertAfter(task.element);
			task.parent().save();
		},

		addState: function(state) {
			return this.element.addClass(state);
		},

		hasState: function(state) {
			return this.element.hasClass(state);
		},

		removeState: function(state) {
			return this.element.removeClass(state);
		},

		insertChild: function(task) {
			if (this.element.parent().size() > 0) {
				var parent = this.parent();
				this.element.detach();
				parent.save();
			}
			this.element.insertAfter(task.element.find("> .task-list > .task-insert-child"));
			task.save();
		},

		appendChild: function(task) {
			if (this.element.parent().size() > 0) {
				var parent = this.parent();
				this.element.detach();
				parent.save();
			}
			this.element.appendTo(task.element.children(".task-list"));
			task.save();
		},

		remove: function() {
			function helper(task) {
				_.each(task.children(), helper);
				localStorage.removeItem(task.id());
				task.element.remove();
			}

			var parent = this.parent();
			helper(this);
			parent.save();
		},

		previous: function() {
			return new Task(this.element.prev(".task"));
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
			}
		},

		id: function(new_id) {
			if (_.isUndefined(new_id)) {
				return this.element.attr("id");
			} else {
				this.element.attr("id", new_id);
			}
		},

		checked: function(new_checked) {
			if (_.isUndefined(new_checked)) {
				return this.element.find("> div > .checkbox-checked").size() == 1;
			} else {
				if (new_checked) {
					this.element.find("> div > .checkbox-unchecked")
						.removeClass("checkbox-unchecked")
						.addClass("checkbox-checked");
				} else {
					this.element.find("> div > .checkbox-checked")
						.removeClass("checkbox-checked")
						.addClass("checkbox-unchecked");
				}
			}
		},

		toggle: function() {
			var $checkbox_checked = this.element.find("> div > .checkbox-checked");
			var $checkbox_unchecked = this.element.find("> div > .checkbox-unchecked");

			$checkbox_unchecked
				.removeClass("checkbox-unchecked")
				.addClass("checkbox-checked");
			$checkbox_checked
				.removeClass("checkbox-checked")
				.addClass("checkbox-unchecked");
			this.save();
		},

		stringify: function() {
			return JSON.stringify({
				id: this.id(),
				title: this.title(),
				checked: this.checked(),
				children: _.map(this.children(), function(child) {
					return child.id();
				})
			});
		},

		exists: function() {
			return this.element.size() == 1;
		},

		save: function() {
			localStorage.setItem(this.id(), this.stringify());
		}
	};

	Task.load = function(id) {
		var json = JSON.parse(localStorage.getItem(id));
		var task = Task.initialize(json);

		_.each(json.children, function(child) {
			Task.load(child).appendChild(task);
		});

		return task;
	}

	Task.initialize = function(o) {
		var task = new Task();

		// TODO: better mechanism for defaults?
		o.id = _.isUndefined(o.id) ? Task.createId() : o.id;
		o.title = _.isUndefined(o.title) ? "" : o.title;
		o.checked = _.isUndefined(o.checked) ? false : o.checked;

		task.id(o.id);
		task.title(o.title);
		task.checked(o.checked);
		task.save();

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
		// TODO: check to see if it's a string?
		return new Task(selector.closest(".task"));
	}

	Task.insertChildDrop = {
		hoverClass: "ui-state-highlight",
		drop : function(e, ui) {
			var $task = $(ui.draggable);
			$task.css({top:0,left:0});

			Task.get($task).insertChild(Task.get($(this)));
		}
	};

	Task.insertAfterDrop = {
		hoverClass: "ui-state-highlight",
		drop : function(e, ui) {
			var $task = $(ui.draggable);
			$task.css({top:0,left:0});

			Task.get($task).insertAfter(Task.get($(this)));
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
				.insertChild(new Task($("#task-root")));
			$("#task-add").val("");
		}
	});

	$(".checkbox-checked,.checkbox-unchecked").click(function(e) {
		Task.get($(e.currentTarget)).toggle();
	});

	$(".delete").click(function(e) {
		var task = Task.get($(e.currentTarget));
		task.remove();
	});

	$(".task-insert-child").click(function(e) {
		var task = Task.initialize({});
		task.insertChild(Task.get($(e.currentTarget)));
		task.addState("task-title-create");
		task.element.find("> div > .task-title").click();
	});

	$(".task-insert-after").click(function(e) {
		var task = Task.initialize({});
		task.insertAfter(Task.get($(e.currentTarget)));
		task.addState("task-title-create");
		task.element.find("> div > .task-title").click();
	});

	// TODO: make this work with drag/drop
	// we want this to be either on mouseup or as a drag/drop callback?
	// only have a single instance that moves around?
	// drag/drop needs just a little bit of snap
	$(".task-title").click(function(e) {
		var $title = $(e.currentTarget);
		$title.hide();
		$title.siblings(".task-title-edit")
			.val($title.text())
			.show()
			.focus()
			.select();
	});

	$(".task-title-edit").focusout(function(e) {
		var task = Task.get($(e.currentTarget));
		var $editing = $(e.currentTarget);
		var $title = $editing.siblings(".task-title");

		if (task.hasState("task-title-moving"))
			return;

		if ($editing.val().trim() != "") {
			task.title($editing.val().trim());
			task.save();

			task.removeState("task-title-create");
		} else if (task.hasState("task-title-create")) {
			Task.get($title).remove();
			return;
		}

		$editing.hide();
		$title.show();
	});

	var shiftDown = false;

	$(".task-title-edit").keydown(function(e) {
		// TODO: enter should add a new task below
		switch (e.keyCode) {
		case 9:
			var $title = $(e.currentTarget);
			var task = Task.get($title);

			if (shiftDown) {
				var parent = task.parent();

				if (parent.id() == "task-root")
					return false;

				task.addState("task-title-moving");
				task.insertAfter(parent);
				task.removeState("task-title-moving");

				$title.focus().select();
			} else {
				var previous = task.previous();

				if (!previous.exists())
					return false;

				task.addState("task-title-moving");
				task.insertChild(previous);
				task.removeState("task-title-moving");

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
		var rootTask = new Task($("#task-root"));
		_.each(root.children, function(child) {
			Task.load(child).appendChild(rootTask);
		});
	}
});

