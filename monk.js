$(document).ready(function() {
	// TODO: check that it's not the empty string
	$("#task-add").keypress(function(e) {
		if (e.keyCode == 13) {
			$("#prototype > li")
				.clone(deepWithDataAndEvents=true)
				.appendTo("#task-root")
				.show()
				.find(".task-title")
					.html($("#task-add").val());
			$("#task-add").val("");
		}
	});

	$(".task-close").click(function(e) {
		$(e.currentTarget).parent().remove();
	});

	$(".task-add-button").click(function(e) {
		$("#prototype > li")
			.clone(deepWithDataAndEvents=true)
			.insertAfter($(e.currentTarget).closest(".task-list > *"))
			.show();
	});

	// TODO: make this work with drag/drop
	// we want this to be either on mouseup or as a drag/drop callback?
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

	// TODO: rewrite with drag/drop
	$(".task-list").sortable({
		handle: "> *",
		items: "li",
		placeholder: "ui-state-highlight",
		connectWith: ".task-list"
	});

	// TODO: date picker

	// TODO: html5 local storage

	// TODO: cloud syncing
});

