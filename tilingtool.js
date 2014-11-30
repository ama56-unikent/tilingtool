function TilingTool(){

	var self = this,
		$tilingTool = $("div.tilingtool"),
		$canvas = $tilingTool.find("div.canvas"),
		$paramGen = $tilingTool.find("form.paramgen"),
		$outputWrapper = $tilingTool.find("div.output"),
		$outputHTML = $outputWrapper.find("pre.html"),
		$paramGenChildren = $paramGen.find(":input"),
		$grid = $canvas.find("div.grid"),
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
		possibleXpositions = [],
		currentSliceMode = 0;

	init();

	function init(){
		buildConstants();
		buildCanvas();
		buildRulers();
		listen();
	}

	function buildConstants() {
		var $sampleRow = $horizontalRuler.find("div[class*='row']"),
			$sampleSpan = $sampleRow.find("div[class*='span']:nth-child(2)");

		TilingTool.VERTICAL_CROSSHAIRS_THICKNESS = px2Float($sampleSpan, "margin-left");
		TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS = px2Float($sampleRow, "margin-bottom");
		TilingTool.COLUMN_UNIT = px2Float($sampleSpan, "width");

		setupDynamicCSS();

		function setupDynamicCSS() {
			$sampleRow.css({"margin-bottom": 0});

			$vertCrosshairsLeg.css({width: TilingTool.VERTICAL_CROSSHAIRS_THICKNESS});
			
			$vertCrosshairsLeg.find("div.cell").each(function(){
				var $cell = $(this),
					borderWidth = (TilingTool.VERTICAL_CROSSHAIRS_THICKNESS - 1)/2;
					
					$cell.css({
						"border-left-width": borderWidth,
						"border-right-width": borderWidth
					});
			});

			$horizCrosshairsLeg.css({height: TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS});

			$horizCrosshairsLeg.find("div.cell").each(function(){
				var $cell = $(this),
					borderWidth = (TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS - 1)/2;
					
					$cell.css({
						"border-top-width": borderWidth,
						"border-bottom-width": borderWidth
					});
			});
		}
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

		function buildHorizontalRuler(){
			var index = 1;
			$horizontalRuler.find("div.span1").each(function(){
				var $span = $(this);
				$span.addClass("unit-id"+index);

				var marginLeft = px2Float($span, "margin-left");
				if(marginLeft!==0){
					var left = $span.position().left,
						borderWidth = (TilingTool.VERTICAL_CROSSHAIRS_THICKNESS - 1)/2;

					$markerTemplate.clone().addClass("marker-id-"+(index-1))
						.css({
							left: left,
							borderLeftWidth: borderWidth,
							borderRightWidth: borderWidth
						})
						.appendTo($horizontalRuler);

					possibleXpositions.push(left);
				}

				index++;
			});

			horizontalSnap( possibleXpositions[ 
				Math.round(possibleXpositions.length / 2) - 1 ] );
		}	

		function buildVerticalRuler(){
			var height = $canvas.height(),
				step = 5,
				top = 5;

			while(top<height){
				var $marker = $markerTemplate.clone().addClass("marker-id-"+top)
								.css({top:top-0.5});
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

			verticalSnap(height/2);

			function isEven(num) { return (num%2)===0; }
			function isOdd(num) { return !isEven(num); }
		}
	}

	function listen(){
		$paramGen.submit(function(event){
			event.preventDefault();
		});

		$paramGenChildren.filter("input[type='text']").change(function(event){
			paramAction($(this).attr("name"),$(this).val());
		});

		$paramGenChildren.filter("button").click(function(event){
			paramAction($(this).attr("name"),$(this).val());
		});

		$canvas.mousemove(followMouse);

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.addClass("active");
			$verticalRuler.addClass("active");
			currentSliceMode |= TilingTool.SLICE_MODE.HORIZ;
			if($currentMouseElement.is("[class*='span']"))
				highlightHorizontalCrosshairs();
		},"keypress");

		Mousetrap.bind("h",function(){
			$horizCrosshairsLeg.removeClass("active");
			$horizCrosshairsLegLeft.removeClass("active");
			$horizCrosshairsLegRight.removeClass("active");
			$horizCrosshairsLegMiddle.removeClass("active");
			$verticalRuler.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.HORIZ;
		},"keyup");

		Mousetrap.bind("v",function(){
			$vertCrosshairsLeg.addClass("active");
			$horizontalRuler.addClass("active");
			currentSliceMode |= TilingTool.SLICE_MODE.VERT;
			if($currentMouseElement.is("[class*='span']"))
				highlightVerticalCrosshairs();
		},"keypress");

		Mousetrap.bind("v",function(){
			$vertCrosshairsLeg.removeClass("active");
			$vertCrosshairsLegTop.removeClass("active");
			$vertCrosshairsLegMiddle.removeClass("active");
			$vertCrosshairsLegBottom.removeClass("active");
			$horizontalRuler.removeClass("active");
			currentSliceMode &= ~TilingTool.SLICE_MODE.VERT;
		},"keyup");

		$canvas.mouseout(function(){
			$vertCrosshairsLegTop.removeClass("active");
			$vertCrosshairsLegMiddle.removeClass("active");
			$vertCrosshairsLegBottom.removeClass("active");
			$horizCrosshairsLegLeft.removeClass("active");
			$horizCrosshairsLegRight.removeClass("active");
			$horizCrosshairsLegMiddle.removeClass("active");
			$horizontalRuler.removeClass("active");
			$horizontalRuler.removeClass("active");
		});

		$canvas.click(detectSliceMode);
	}

	function paramAction(name, value){
		switch(name){
			case "canvas-height":
				$canvas.css({height: value});
				break;
			case "export":
				exportMarkup();
				break;
		}
	}

	function followMouse(event){
		event.stopPropagation();

		var offset = $canvas.offset(),
			xLimit = $canvas.innerWidth() - TilingTool.VERTICAL_CROSSHAIRS_THICKNESS,
			yLimit = $canvas.innerHeight() - TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS,
			xNormalizationFactor = (TilingTool.VERTICAL_CROSSHAIRS_THICKNESS-1)/2,
			yNormalizationFactor = (TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS-1)/2;
			newX = event.pageX - offset.left - xNormalizationFactor,
			newY = event.pageY - offset.top - yNormalizationFactor;

		if(newX<0)
			newX = 0;
		else if(newX>xLimit)
			newX = xLimit;

		if(newY<0)
			newY = 0;
		else if(newY>yLimit)
			newY = yLimit;

		horizontalSnap(newX);
		verticalSnap(newY);

		$currentMouseElement = $(event.target);
		if($currentMouseElement.is("[class*='span']")){			
			if((TilingTool.SLICE_MODE.HORIZ & currentSliceMode) === 
				TilingTool.SLICE_MODE.HORIZ)
				highlightHorizontalCrosshairs();

			if((TilingTool.SLICE_MODE.VERT & currentSliceMode) === 
				TilingTool.SLICE_MODE.VERT)
				highlightVerticalCrosshairs();
		}
	}

	function horizontalSnap(currentX){
		var leastDiff;
		for(var i=0 ; i<possibleXpositions.length; i++){
			var xPosition = possibleXpositions[i];
			var diff = Math.abs(xPosition - currentX);
			if(leastDiff===undefined)
				leastDiff = diff;
			else{
				if(leastDiff<=diff){
					currentX = possibleXpositions[i-1];
					break;
				}
				else{
					leastDiff = diff;
					if(i===possibleXpositions.length-1)
						currentX = possibleXpositions[i];
				}
			}
		}

		// We pass i instead of i-1 because the markers are numbered starting from 1
		highlightMarker(i, $horizontalRuler);

		$vertCrosshairsLeg.css({left: currentX}).attr({"data-position-index":i});
	}

	function verticalSnap(currentY){

		var remainder;
		currentY = Math.round(currentY);

		if(currentY<5)
			remainder = currentY;
		else
			remainder = currentY%5;

		if(remainder<2.5)
			currentY -= remainder;
		else
			currentY += (5-remainder);

		highlightMarker(currentY, $verticalRuler);

		var top = currentY - (TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS/2);
		
		$horizCrosshairsLeg.css({top: top}).attr({"data-position-index":top});
	}

	function highlightMarker(markerID, $ruler){
		$ruler.find("div.marker.active").each(function(){
			$(this).removeClass("active");
			$(this).find("div.number.active").removeClass("active");
		});
		$ruler.find("div.marker.marker-id-"+markerID).each(function(){
			$(this).addClass("active");
			$(this).find("div.number").addClass("active");
		});
	}

	function highlightHorizontalCrosshairs(){
		var left = $currentMouseElement.position().left
					 + px2Float($currentMouseElement,"margin-left"),
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
		var top = $currentMouseElement.position().top,
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

		var $span = $(event.target),
			horizontalTiles = [],
			verticalTiles = [];

		if($span.is("[class*='span']")){
			if((TilingTool.SLICE_MODE.HORIZ & currentSliceMode) === 
				TilingTool.SLICE_MODE.HORIZ){
				var currentStartPoint = $span.position().top,
					currentHeight = $span.height(),
					slicePoint = parseInt($horizCrosshairsLeg.attr("data-position-index"));
				
				verticalTiles[0] = {};
				verticalTiles[0].height = slicePoint - currentStartPoint;

				verticalTiles[1] = {};
				verticalTiles[1].height = currentHeight - verticalTiles[0].height 
											- TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS;
			}

			if((TilingTool.SLICE_MODE.VERT & currentSliceMode) === 
				TilingTool.SLICE_MODE.VERT){
				var currentStartPoint = parseInt($span.attr("data-start-point")),
					currentType = parseInt($span.attr("data-span-type")),
					slicePoint = parseInt($vertCrosshairsLeg.attr("data-position-index"));

				horizontalTiles[0] = {};
				horizontalTiles[0].start = currentStartPoint;
				horizontalTiles[0].type = slicePoint - currentStartPoint;

				horizontalTiles[1] = {};
				horizontalTiles[1].start = slicePoint;
				horizontalTiles[1].type = currentType - horizontalTiles[0].type;
			}

			if(horizontalTiles.length>0 || verticalTiles.length>0)
				slice($span, horizontalTiles, verticalTiles);
		}
	}

	function px2Float($element, prop){
		return parseFloat($element.css(prop).replace("px",""));
	}

	function slice($source, horizontalTiles, verticalTiles){

		if(verticalTiles.length>0)
			sliceHorizontally();

		if(horizontalTiles.length>0)
			sliceVertically();

		function sliceHorizontally(){

			var $newSource = null,
				$currentRow = $source.parent("div[class*='row']");			

			if($currentRow.find("div[class*='span']").length===1){				
				$source.removeClass("initial");

				verticalTiles.forEach(function(tile){
					var $row = $currentRow.clone();

					$row.find("div[class*='span']").height(tile.height);

					if($newSource)
						$newSource = $newSource.add($row);
					else
						$newSource = $row;
				});

				if($newSource){
					$currentRow.replaceWith($newSource);
					$source = $newSource;
				}
			}
			else{
				verticalTiles.forEach(function(tile){
					var $row = $("<div class='row-fixed'>");

					$source.clone().height(tile.height).appendTo($row);

					if($newSource)
						$newSource = $newSource.add($row);
					else
						$newSource = $row;
				});

				if($newSource)
					$source.append($newSource);
			}
		}

		function sliceVertically(){

			if($source.is("div[class*='span']:empty"))
				sliceUpSpan($source);
			else{
				$source.find("div[class*='span']:empty").each(function(){
					sliceUpSpan($(this));
				});
			}

			function sliceUpSpan($source) {
				var $newSource = null,
					sourceHeight = $source.height();

				horizontalTiles.forEach(function(tile){
					var $span =	$("<div>")
									.addClass("span"+tile.type)
									.attr({
										"data-start-point": tile.start,
										"data-span-type": tile.type
									})
									.height(sourceHeight);

					if($newSource)
						$newSource = $newSource.add($span);
					else
						$newSource = $span;
				});			

				$source.replaceWith($newSource);
			}
		}
	}

	function exportMarkup(){
		var $exportGrid = $grid.clone(),
			$exportHTML = "";

		$exportGrid.find("div.initial").removeClass("initial");
		$exportHTML = $.htmlClean($exportGrid.html(), {format:true})

		$outputHTML.text($exportHTML);
		hljs.highlightBlock($outputHTML[0]);

		$outputWrapper.show();
	}
}

TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS = 0;
TilingTool.VERTICAL_CROSSHAIRS_THICKNESS = 0;
TilingTool.COLUMN_UNIT = 0;
TilingTool.SLICE_MODE = {
	HORIZ: 1,
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