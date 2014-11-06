function TilingTool(){

	var $canvas = $("div.tilingtool.canvas"),
		$paramGen = $("form.tilingtool.paramgen"),
		currentlySelected = null;

	init();

	function init(){
		listen();
	}

	function listen(){

		$paramGen.submit(function(event){
			event.preventDefault();
		});
		
		var $paramGenChildren = $paramGen.find(":input").each(function(event){
			if($(this).hasClass("autostart"))
				paramAction($(this).attr("name"),$(this).val());
		});

		$paramGenChildren.filter("input[type='text']").change(function(event){
			paramAction($(this).attr("name"),$(this).val());
		});

		$paramGenChildren.filter("input[type='button']").click(function(event){
			paramAction($(this).attr("name"),$(this).val());
		});

		$(".selectable").click(function(event){
			event.stopPropagation();
			console.log(event.target);
			setSelected(event.target);
		});
	}

	function setSelected(selectMe){
		if(selectMe && selectMe===currentlySelected)
			return;

		if(currentlySelected)
			$(currentlySelected).removeClass("selected");

		if(selectMe){
			$(selectMe).addClass("selected");
			currentlySelected = selectMe;
		}
		else
			currentlySelected = null;
	}

	function paramAction(name, value){
		switch(name){
			case "canvas-height":
				$canvas.css({height: value});
				break;
			case "add-row":
				addRow();
				break;
			case "deselect-all":
				setSelected();
				break;
		}
	}

	function addRow(){		
		if(currentlySelected){
			var $fluidRow = $("<div class='row-fluid selectable'>");
			$(currentlySelected).append($fluidRow);
		}
	}
}