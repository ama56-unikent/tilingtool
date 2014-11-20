function TilingTool(){

	var $tilingTool = $("div.tilingtool"),
		$canvas = $tilingTool.find("div.canvas"),
		$paramGen = $tilingTool.find("form.paramgen"),
		$paramGenChildren = $paramGen.find(":input"),
		$horizontalRuler = $canvas.find("div.ruler.horizontal"),
		$verticalRuler = $canvas.find("div.ruler.vertical"),
		$horizCrosshairsLeg = $canvas.find("div.crosshairs.horizontal"),
		$horizCrosshairsLegLeft = $horizCrosshairsLeg.find("div.left"),
		$horizCrosshairsLegMiddle = $horizCrosshairsLeg.find("div.middle"),
		$horizCrosshairsLegRight = $horizCrosshairsLeg.find("div.right"),
		$vertCrosshairsLeg = $canvas.find("div.crosshairs.vertical"),
		$vertCrosshairsLegTop = $vertCrosshairsLeg.find("div.top"),
		$vertCrosshairsLegMiddle = $vertCrosshairsLeg.find("div.middle"),
		$vertCrosshairsLegBottom = $vertCrosshairsLeg.find("div.bottom"),
		$markerTemplate = $("<div class='marker'>"),
		$numberTemplate = $("<div class='number'>"),
		$currentMouseElement = $canvas,
		currentSliceMode = 0;

	init();

	function init(){
		buildCanvas();
		buildRulers();
		listen();
	}

	function buildCanvas(){
		$paramGenChildren.each(function(event){
			if($(this).hasClass("autostart"))
				paramAction($(this).attr("name"),$(this).val());
		});
	}

	function buildRulers(){
		buildHorizontalRuler();
		buildVerticalRuler();

		function buildVerticalRuler(){
			var height = $canvas.height(),
				step = 5,
				top = 5;

			while(top<height){
				var $marker = $markerTemplate.clone().css({top:top});
				var num = top/25;

				if(Number.isInteger(num)){
					if(isEven(num)){
						$marker.addClass("large");
						$marker.append($numberTemplate.clone().html(top));					
					}
					else if(isOdd(num))
						$marker.addClass("medium");
				}
				else
					$marker.addClass("small");

				$marker.appendTo($verticalRuler);
				top += step;
			}

			function isEven(x) { return (x%2)==0; }
			function isOdd(x) { return !isEven(x); }
		}

		function buildHorizontalRuler(){
			var left = TilingTool.COLUMN_UNIT;
			for(var i=0; i<11; i++){
				$markerTemplate.clone().css({left:left}).appendTo($horizontalRuler);
				left += TilingTool.CROSSHAIRS_THICKNESS + TilingTool.COLUMN_UNIT;
			}
		}		
	}

	function listen(){
		$paramGen.submit(function(event){
			event.preventDefault();
		});

		$paramGenChildren.filter("input[type='text']").change(function(event){
			paramAction($(this).attr("name"),$(this).val());
		});

		$paramGenChildren.filter("input[type='button']").click(function(event){
			paramAction($(this).attr("name"),$(this).val());
		});

		$canvas.mousemove(followMouse);

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.addClass("active");
			currentSliceMode |= TilingTool.SLICE_MODE.HORIZ;
			if($currentMouseElement.hasClass("tile"))
				highlightHorizontalCrosshairs();
		},"keypress");

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.removeClass("active");
			$horizCrosshairsLegLeft.removeClass("active");
			$horizCrosshairsLegRight.removeClass("active");
			$horizCrosshairsLegMiddle.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.HORIZ;
		},"keyup");

		Mousetrap.bind("v",function(){
			$vertCrosshairsLeg.addClass("active");
			currentSliceMode |= TilingTool.SLICE_MODE.VERT;
			if($currentMouseElement.hasClass("tile"))
				highlightVerticalCrosshairs();
		},"keypress");

		Mousetrap.bind("v",function(){
			$vertCrosshairsLeg.removeClass("active");
			$vertCrosshairsLegTop.removeClass("active");
			$vertCrosshairsLegMiddle.removeClass("active");
			$vertCrosshairsLegBottom.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.VERT;
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

		$currentMouseElement = $(event.target);
		if($currentMouseElement.hasClass("tile")){			
			if((TilingTool.SLICE_MODE.HORIZ & currentSliceMode) === 
				TilingTool.SLICE_MODE.HORIZ)
				highlightHorizontalCrosshairs();

			if((TilingTool.SLICE_MODE.VERT & currentSliceMode) === 
				TilingTool.SLICE_MODE.VERT)
				highlightVerticalCrosshairs();
		}
	}

	function highlightHorizontalCrosshairs(){
		var left = get($currentMouseElement,"left"),
			width = $currentMouseElement.width(),
			end = Math.round(left + width),
			canvasWidth = $canvas.width();

		$horizCrosshairsLegLeft.removeClass("active");
		$horizCrosshairsLegRight.removeClass("active");
		$horizCrosshairsLegMiddle.removeClass("active");			

		if(left===0 && end===canvasWidth){
			$horizCrosshairsLegLeft.addClass("active");
			$horizCrosshairsLegMiddle.addClass("active");
			$horizCrosshairsLegRight.addClass("active");
		}
		else if(left===0){
			$horizCrosshairsLegLeft.addClass("active");
			$horizCrosshairsLegLeft.width(width);
			$horizCrosshairsLegMiddle.width("auto");
			$horizCrosshairsLegRight.width("auto");
		}
		else if(end===canvasWidth){
			$horizCrosshairsLegRight.addClass("active");
			$horizCrosshairsLegLeft.width("auto");
			$horizCrosshairsLegMiddle.width("auto");
			$horizCrosshairsLegRight.width(width);
		}
		else{
			$horizCrosshairsLegMiddle.addClass("active");
			$horizCrosshairsLegLeft.width(left);
			$horizCrosshairsLegMiddle.width(width);
			$horizCrosshairsLegRight.width("auto");
		}
	}

	function highlightVerticalCrosshairs(){
		var top = get($currentMouseElement,"top"),
			height = $currentMouseElement.height(),
			end = Math.round(top + height),
			canvasHeight = $canvas.height();

		$vertCrosshairsLegTop.removeClass("active");
		$vertCrosshairsLegMiddle.removeClass("active");
		$vertCrosshairsLegBottom.removeClass("active");

		if(top===0 && end===canvasHeight){
			$vertCrosshairsLegTop.addClass("active");
			$vertCrosshairsLegMiddle.addClass("active");
			$vertCrosshairsLegBottom.addClass("active");
		}
		else if(top===0){
			$vertCrosshairsLegTop.addClass("active");
			$vertCrosshairsLegTop.height(height);
			$vertCrosshairsLegMiddle.height("auto");
			$vertCrosshairsLegBottom.height("auto");
		}
		else if(end===canvasHeight){
			$vertCrosshairsLegBottom.addClass("active");
			$vertCrosshairsLegTop.height("auto");
			$vertCrosshairsLegMiddle.height("auto");
			$vertCrosshairsLegBottom.height(height);
		}
		else{
			$vertCrosshairsLegMiddle.addClass("active");
			$vertCrosshairsLegTop.height(top);
			$vertCrosshairsLegMiddle.height(height);
			$vertCrosshairsLegBottom.height("auto");			
		}
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
TilingTool.COLUMN_UNIT = 54.359;
TilingTool.SLICE_MODE = {HORIZ: 1,
	VERT: 2
};

/*\
|*|
|*|  :: Number.isInteger() polyfill ::
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
|*|
\*/

if (!Number.isInteger) {
  Number.isInteger = function isInteger(nVal) {
    return typeof nVal === 'number'
      && isFinite(nVal)
      && nVal > -9007199254740992
      && nVal < 9007199254740992
      && Math.floor(nVal) === nVal;
  };
}