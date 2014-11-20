function TilingTool(){

	var $canvas = $("div.tilingtool.canvas"),
		$paramGen = $("form.tilingtool.paramgen"),
		$horizCrosshairsLeg = $canvas.find("div.crosshairs.horizontal"),
		$horizCrosshairsLegLeft = $horizCrosshairsLeg.find("div.left"),
		$horizCrosshairsLegMiddle = $horizCrosshairsLeg.find("div.middle"),
		$horizCrosshairsLegRight = $horizCrosshairsLeg.find("div.right"),
		$vertCrosshairsLeg = $canvas.find("div.crosshairs.vertical"),
		$vertCrosshairsLegTop = $vertCrosshairsLeg.find("div.top"),
		$vertCrosshairsLegMiddle = $vertCrosshairsLeg.find("div.middle"),
		$vertCrosshairsLegBottom = $vertCrosshairsLeg.find("div.bottom"),
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
			$vertCrosshairsLegTop.removeClass("active");
			$vertCrosshairsLegMiddle.removeClass("active");
			$vertCrosshairsLegBottom.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.VERT;
		},"keyup");

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.addClass("active");
			currentSliceMode |= TilingTool.SLICE_MODE.HORIZ;
		},"keydown");

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.removeClass("active");
			$horizCrosshairsLegLeft.removeClass("active");
			$horizCrosshairsLegRight.removeClass("active");
			$horizCrosshairsLegMiddle.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.HORIZ;
		},"keyup");

		$canvas.mouseout(function(){
			$vertCrosshairsLegTop.removeClass("active");
			$vertCrosshairsLegMiddle.removeClass("active");
			$vertCrosshairsLegBottom.removeClass("active");
			$horizCrosshairsLegLeft.removeClass("active");
			$horizCrosshairsLegRight.removeClass("active");
			$horizCrosshairsLegMiddle.removeClass("active");
		});

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

		// var $activeTile = $(event.target);
		// if($activeTile.hasClass("tile")){			
		// 	if((TilingTool.SLICE_MODE.HORIZ & currentSliceMode) === 
		// 		TilingTool.SLICE_MODE.HORIZ)
		// 		highlightHorizontalCrosshairs($activeTile);

		// 	if((TilingTool.SLICE_MODE.VERT & currentSliceMode) === 
		// 		TilingTool.SLICE_MODE.VERT)
		// 		highlightVerticalCrosshairs($activeTile);
		// }
	}

	function highlightHorizontalCrosshairs($activeTile){
		var left = get($activeTile,"left"),
			width = $activeTile.width(),
			end = Math.round(left + width),
			canvasWidth = $canvas.width();

		console.log(left + "	" + width + "	" + end);

		$horizCrosshairsLegLeft.removeClass("active");
		$horizCrosshairsLegRight.removeClass("active");
		$horizCrosshairsLegMiddle.removeClass("active");			

		if(left==="0" && end===canvasWidth){
			$horizCrosshairsLegLeft.addClass("active");
			$horizCrosshairsLegMiddle.addClass("active");
			$horizCrosshairsLegRight.addClass("active");
		}
		else if(left==="0"){
			$horizCrosshairsLegLeft.addClass("active");
		}
		else if(end===canvasWidth){
			$horizCrosshairsLegRight.addClass("active");
		}
		else{
			$horizCrosshairsLegMiddle.addClass("active");
		}
	}

	function highlightVerticalCrosshairs($activeTile){
		var top = get($activeTile,"top"),
			height = $activeTile.height();

		$vertCrosshairsLegTop.removeClass("active");
		$vertCrosshairsLegMiddle.removeClass("active");
		$vertCrosshairsLegBottom.removeClass("active");
	}

	function detectSliceMode(event){
		event.stopPropagation();

		var horizGap = {},
			vertGap = {};

		if($(event.target).hasClass("tile")){
			if((TilingTool.SLICE_MODE.HORIZ & currentSliceMode) === 
				TilingTool.SLICE_MODE.HORIZ){
				horizGap.start = get($horizCrosshairsLeg, "top");
				horizGap.end = get($horizCrosshairsLeg, "top") + 
								TilingTool.CROSSHAIRS_THICKNESS;
			}

			if((TilingTool.SLICE_MODE.VERT & currentSliceMode) === 
				TilingTool.SLICE_MODE.VERT){
				vertGap.start = get($vertCrosshairsLeg, "left");
				vertGap.end = get($vertCrosshairsLeg, "left") + 
								TilingTool.CROSSHAIRS_THICKNESS;
			}

			if(!$.isEmptyObject(horizGap) || !$.isEmptyObject(vertGap))
				slice($(event.target), horizGap, vertGap);
		}

		
	}

	function get($element, side){
		return parseFloat($element.css(side).replace("px",""));
	}

	function slice($source, horizGap, vertGap){
		var finalTiles = [],
			tempHorizTiles = [];

		if(!$.isEmptyObject(horizGap))
			tempHorizTiles = sliceHorizontally($source);

		if(!$.isEmptyObject(vertGap)){
			if(tempHorizTiles.length > 0){
				tempHorizTiles.forEach(function($source){
					finalTiles = finalTiles.concat(sliceVertically($source));
				});				
			}
			else
				finalTiles = sliceVertically($source);
		}
		else
			finalTiles = tempHorizTiles;

		if(finalTiles.length > 0){
			$source.remove();
			finalTiles.forEach(function($newTile){
				$newTile.prependTo($canvas);
			});
		}

		function sliceHorizontally($source){
			var $topTile = clone($source),
				$bottomTile = clone($source),
				sourceTop = get($source, "top"),
				sourceLeft = get($source, "left"),
				sourceHeight = $source.height(),
				sourceWidth = $source.width(),
				topTileHeight = horizGap.start - sourceTop,
				bottomTileHeight = sourceHeight - (horizGap.end - sourceTop);

			$topTile.css({
				top: sourceTop,
				left: sourceLeft,
				height: topTileHeight,
				width: sourceWidth
			});

			$bottomTile.css({
				top: horizGap.end,
				left: sourceLeft,
				height: bottomTileHeight,
				width: sourceWidth
			});

			return [$topTile, $bottomTile];
		}

		function sliceVertically($source){
			var $leftTile = clone($source),
				$rightTile = clone($source),
				sourceTop = get($source, "top"),
				sourceLeft = get($source, "left"),
				sourceHeight = $source.height(),
				sourceWidth = $source.width(),
				leftTileWidth = vertGap.start - sourceLeft,
				rightTileWidth = sourceWidth - (vertGap.end - sourceLeft);

			$leftTile.css({
				top: sourceTop,
				left: sourceLeft,
				height: sourceHeight,
				width: leftTileWidth
			});

			$rightTile.css({
				top: sourceTop,
				left: vertGap.end,
				height: sourceHeight,
				width: rightTileWidth
			});

			return [$leftTile, $rightTile];
		}

		function clone($element){
			return $element.clone().removeClass("initial");
		}
	}
}

TilingTool.CROSSHAIRS_THICKNESS = 9.047;
TilingTool.SLICE_MODE = {HORIZ: 1,
	VERT: 2
};