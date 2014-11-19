function TilingTool(){

	var $canvas = $("div.tilingtool.canvas"),
		$paramGen = $("form.tilingtool.paramgen"),
		$horizCrosshairsLeg = $canvas.find("div.crosshairs.horizontal"),
		$vertCrosshairsLeg = $canvas.find("div.crosshairs.vertical"),
		$horizCutTemplate = $("<div class='cut horizontal'>"),
		$vertCutTemplate = $("<div class='cut vertical'>"),
		currentSliceMode = 0;

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

		$canvas.mousemove(followMouse);

		Mousetrap.bind("v",function(){
			$vertCrosshairsLeg.addClass("active");
			currentSliceMode |= TilingTool.SLICE_MODE.VERT;
		},"keydown");

		Mousetrap.bind("v",function(){
			$vertCrosshairsLeg.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.VERT;
		},"keyup");

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.addClass("active");
			currentSliceMode |= TilingTool.SLICE_MODE.HORIZ;
		},"keydown");

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.HORIZ;
		},"keyup");

		$canvas.click(detectSliceMode);
	}

	function paramAction(name, value){
		switch(name){
			case "canvas-height":
				$canvas.css({height: value});
				break;
		}
	}

	function followMouse(event){
		event.stopPropagation();

		var offset = $canvas.offset(),
			xLimit = $canvas.innerWidth() - TilingTool.CROSSHAIRS_THICKNESS,
			yLimit = $canvas.innerHeight() - TilingTool.CROSSHAIRS_THICKNESS,
			normalizationFactor = (TilingTool.CROSSHAIRS_THICKNESS-1)/2;
			newX = event.pageX - offset.left - normalizationFactor,
			newY = event.pageY - offset.top - normalizationFactor;

		if(newX<0)
			newX = 0;
		else if(newX>xLimit)
			newX = xLimit;

		if(newY<0)
			newY = 0;
		else if(newY>yLimit)
			newY = yLimit;

		$horizCrosshairsLeg.css({top: newY});
		$vertCrosshairsLeg.css({left:newX});
	}

	function detectSliceMode(event){
		event.stopPropagation();

		if((TilingTool.SLICE_MODE.HORIZ & currentSliceMode) === 
			TilingTool.SLICE_MODE.HORIZ)
			slice($horizCrosshairsLeg, $horizCutTemplate);

		if((TilingTool.SLICE_MODE.VERT & currentSliceMode) === 
			TilingTool.SLICE_MODE.VERT)
			slice($vertCrosshairsLeg, $vertCutTemplate);	
	}

	function slice($source, $cut){
		$cut.clone().css({
			top: $source.css("top"),
			left: $source.css("left")
		}).appendTo($canvas);
	}
}

TilingTool.CROSSHAIRS_THICKNESS = 9.047;
TilingTool.SLICE_MODE = {HORIZ: 1,
	VERT: 2
};