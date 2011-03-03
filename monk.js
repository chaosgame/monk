$(document).ready(function() {
	// TODO: a library of functions could possibly be nice
	// TODO: we can actually have multiple classes per html element
	//       (separate by spaces)

	function putTaskNextChild(task, target) {
		task.insertAfter(target.closest(".task-list > *"))
			.show();
	}

	function createTask() {
		var task = $("#prototype > li")
			.clone(deepWithDataAndEvents=true)
			.draggable({
				handle: "> .task-title",
				revert: "invalid",
				revertDuration: 100,
			});
		task.find("#task-add-child,#task-add-next")
			.droppable({
				hoverClass: "ui-state-highlight",
				drop: function(e, ui) {
					// TODO: There should be a better way to do this
					$(ui.draggable).css({top:0,left:0});
					putTaskNextChild($(ui.draggable), $(this));
				}
			});
		return task;
	}

	$("#task-add").keypress(function(e) {
		if (e.keyCode == 13 && $("#task-add").val().trim() != "") {
			createTask()
				.appendTo("#task-root")
				.find(".task-title")
					.html($("#task-add").val())
				.show();
			$("#task-add").val("");
		}
	});

	$(".task-close").click(function(e) {
		$(e.currentTarget).parent().remove();
	});

	$("#task-add-child,#task-add-next").click(function(e) {
		putTaskNextChild(createTask(), $(e.currentTarget));
	});

	// TODO: make this work with drag/drop
	// we want this to be either on mouseup or as a drag/drop callback?
	// only have a single instance that moves around?
	// drag/drop needs just a little bit of snap
	$(".task-title").click(function(e) {
		var title = $(e.currentTarget);
		title.hide();
		title.siblings('.task-title-edit')
			.val(title.html())
			.show()
			.focus();
	});

	$(".task-title-edit").focusout(function(e) {
		var title = $(e.currentTarget);
		title.hide();
		title.siblings('.task-title')
			.html(title.val())
			.show();
	});
});

