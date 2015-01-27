function TilingTool(){

	var self = this,
		$tilingTool = $("div.tilingtool"),
		$canvas = $tilingTool.find("div.canvas"),
		$paramGen = $tilingTool.find("form.paramgen"),
		$outputWrapper = $tilingTool.find("div.output"),
		$outputHTML = $outputWrapper.find("pre.html"),
		$codeViewSwitch = $paramGen.find("button[name='code-view-switch']"),
		$codeCopier = $paramGen.find("button[name='code-copier']"),
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
		$bottomExpander = $canvas.find("div.bottom-expander"),
		$resizeMarker = $canvas.find("div.resize-marker"),
		$markerTemplate = $("<div class='marker'>"),
		$numberTemplate = $("<div class='number'>"),
		$currentMouseElement = $canvas,		
		possibleXpositions = [],
		currentSliceMode = 0,
		currentResizeMode = {
			$element: null,
			elementType: "",
			resizeType: ""
		},
		currentMousePosition = {
			x: 0,
			y: 0
		},
		overflowMousePosition = {
			x: 0,
			y: 0
		},
		resizingParentElements = null,
		startResizePosition = null,
		clipboardClient = null,
		currentTileEditMode = 0,
		canvasOffset = $canvas.offset(),
		cursorRelationships = {
			"grid": "vertical-resize-cursor",
			"span": "vertical-resize-cursor",
			"row-fluid": "horizontal-resize-cursor",
			"row-fixed": "horizontal-resize-cursor",
			"bottom-expander": "vertical-resize-cursor"			
		};

	this.turnOnSliceMode = function(){
		$horizCrosshairsLeg.show();
		$vertCrosshairsLeg.show();
		$canvas.find("div.ruler div.marker.active").removeClass("disabled");
		$canvas.find("div.ruler div.marker div.number.active").removeClass("disabled");

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
	};

	this.turnOffSliceMode = function(){
		Mousetrap.unbind(["h","v"]);
		$canvas.off();
		$horizCrosshairsLeg.hide();
		$vertCrosshairsLeg.hide();
		$canvas.find("div.ruler div.marker.active").addClass("disabled");
		$canvas.find("div.ruler div.marker div.number.active").addClass("disabled");
	};

	this.turnOnResizeMode = function(){
		$bottomExpander.show();

		$canvas.mousemove(function(event){
			followMouse(event, true);
			var $element = $(event.target);
			if($element.is("div[class*='span']:empty")){
				$canvas.removeClass("vertical-resize-cursor");
				$canvas.removeClass("horizontal-resize-cursor");
			}
			else{
				for(var className in cursorRelationships){
					if($element.is("div[class*='"+className+"']")){
						$canvas.addClass(cursorRelationships[className]);
						break;
					}
				}
			}
		});

		$(document).mousemove(function(event){
			overflowMousePosition = {
				x: event.pageX,
				y: event.pageY
			};
			$grid.trigger("OverflowMousePosition");
		});

		$canvas.mouseout(function(event){
			$canvas.removeClass("vertical-resize-cursor");
			$canvas.removeClass("horizontal-resize-cursor");
		});

		$canvas.mousedown(function(event){
			var $element = $(event.target);
			if(!$element.is("div[class*='span']:empty")){
				for(var className in cursorRelationships){
					if($element.is("div[class*='"+className+"']")){
						currentResizeMode = {
							$element: $element,
							elementType: className,
							resizeType: cursorRelationships[className]
						};
						break;
					}
				}
				if(currentResizeMode.$element){
					$("body").addClass(currentResizeMode.resizeType);
					resize(event.target, $.extend(true, {}, currentMousePosition));
				}
			}
		});
	};

	this.turnOffResizeMode = function(){
		$canvas.off();
		$(document).off("mousemove");
		$bottomExpander.hide();
	};

	init();

	function init(){
		buildConstants();
		buildCanvas();
		buildRulers();
		listen();
		finalize();
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

			verticalSnap((height/2)-5);

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
	}

	function finalize(){
		exportMarkup();
		clipboardClient = new ZeroClipboard($codeCopier[0]);
		self.turnOffSliceMode();
	}

	function paramAction(name, value){
		switch(name){
			case "code-view-switch":
				if(value==="open")
					openCodeView();
				else if(value==="close")
					closeCodeView();
				break;
			case "create-tile":
			case "resize-tile":
				switchTileEditMode(name, value);
				break;
		}
	}

	function switchTileEditMode(name, command){
		var $button = $("button[name='"+name+"']");
		if($button.hasClass("active")){
			$button.removeClass("active");
			self["turnOff"+command].call(self);
		}
		else{
			var $opposite = $("button[name='"+$button.attr("data-nonparallel")+"']");
			if($opposite.hasClass("active")){
				$opposite.removeClass("active");
				self["turnOff"+$opposite.val()].call(self);
			}
			self["turnOn"+command].call(self);
			$button.addClass("active");
		}
	}

	function followMouse(event, setCurrentXY){
		event.stopPropagation();

		var xLimit = $canvas.innerWidth() - TilingTool.VERTICAL_CROSSHAIRS_THICKNESS,
			yLimit = $canvas.innerHeight() - TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS,
			xNormalizationFactor = (TilingTool.VERTICAL_CROSSHAIRS_THICKNESS-1)/2,
			yNormalizationFactor = (TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS-1)/2;
			newX = event.pageX - canvasOffset.left - xNormalizationFactor,
			newY = event.pageY - canvasOffset.top - yNormalizationFactor;

		if(newX<0)
			newX = 0;
		else if(newX>xLimit)
			newX = xLimit;

		if(newY<0)
			newY = 0;
		else if(newY>yLimit)
			newY = yLimit;

		if(setCurrentXY){
			currentMousePosition = {
				x: horizontalSnap(newX, true),
				y: verticalSnap(newY, true)
			}
			$grid.trigger("NewMousePosition");
			return;
		}

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

	function horizontalSnap(currentX, returnVal){
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

		if(returnVal)
			return currentX;

		// We pass i instead of i-1 because the markers are numbered starting from 1
		highlightMarker(i, $horizontalRuler);

		$vertCrosshairsLeg.css({left: currentX}).attr({"data-position-index":i});
	}

	function verticalSnap(currentY, returnVal){

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

		if(returnVal)
			return currentY+5;

		/**
		 * We add the 5 here so the ruler points to the middle marker. 
		 */
		highlightMarker(currentY+5, $verticalRuler);
		
		$horizCrosshairsLeg.css({top: currentY}).attr({"data-position-index":currentY});
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

				if(verticalTiles[0].height<30 || verticalTiles[1].height<30)
					return;
			}

			if((TilingTool.SLICE_MODE.VERT & currentSliceMode) === 
				TilingTool.SLICE_MODE.VERT){
				var currentStartPoint = parseInt($span.attr("data-start-point")),
					currentType = parseInt($span.attr("data-span-type")),
					slicePoint = parseInt($vertCrosshairsLeg.attr("data-position-index"));

				if(currentStartPoint === slicePoint 
					|| currentStartPoint + currentType === slicePoint)
					return;

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

		exportMarkup();

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
			exportHTML = "";

		$exportGrid.find("div.initial").removeClass("initial");
		exportHTML = $.htmlClean($exportGrid.html(), {format:true})

		$outputHTML.text(exportHTML);
		hljs.highlightBlock($outputHTML[0]);

		$codeCopier.attr({"data-clipboard-text": exportHTML});
	}

	function openCodeView(){
		$outputHTML.show();
		$codeCopier.show();
		$codeViewSwitch.val("close");
		$codeViewSwitch.html("Code View &#10549;");
		$outputWrapper.addClass("min-height-opened");
	}

	function closeCodeView(){
		$outputHTML.hide();
		$codeCopier.hide();
		$codeViewSwitch.val("open");
		$codeViewSwitch.html("Code View &#10548;");
		$outputWrapper.removeClass("min-height-opened");
	}

	function resize(parentElement, clickedPosition){
		var $parentElement = $(parentElement);
		if(!$parentElement.is(currentResizeMode.$element))
			return;

		positionResizeMarker(undefined, true, clickedPosition);
		$resizeMarker.show();

		$grid.on("NewMousePosition", positionResizeMarker);
		$grid.on("OverflowMousePosition", positionExpansionMarker);

		$(document).mouseup(function(){
			$grid.off("NewMousePosition");
			$grid.off("OverflowMousePosition");
			switch(currentResizeMode.elementType){
				case "grid":
				case "span":
					calculateVerticalResizer();
					break;
				case "row-fluid":
				case "row-fixed":
					calculateHorizontalResizer();
					break;
			}			
			startResizePosition = null;
			resizingParentElements = null;
			currentResizeMode = {
				$element: null,
				elementType: "",
				resizeType: ""
			};
			$canvas.css({
				"margin-bottom": 100
			});
			$resizeMarker.hide();
			$canvas.append($resizeMarker);
			$("body").removeClass("horizontal-resize-cursor");
			$("body").removeClass("vertical-resize-cursor");
		});
	}

	function positionExpansionMarker(event){
		if(currentResizeMode.elementType==="bottom-expander"){
			var expansionAmount = overflowMousePosition.y - 
				canvasOffset.top - $canvas.height();
			$("body").scrollTop(expansionAmount);
			$canvas.css({
				"margin-bottom": 100 + expansionAmount
			});
			$resizeMarker.css({
				top: overflowMousePosition.y
			});
		}
	}

	function positionResizeMarker(event, initial, clickedPosition){
		switch(currentResizeMode.elementType){
			case "grid":
			case "span":
				if(initial)
					initialVerticalResizeMarker(clickedPosition);
				else
					moveVerticalResizeMarker();
				break;
			case "row-fluid":
			case "row-fixed":
				if(initial)
					initialHorizontalResizeMarker(clickedPosition);
				else
					moveHorizontalResizeMarker();
				break;
			case "bottom-expander":
				if(initial)
					initialGridExpanderMarker();
				break;
		}
	}

	function initialGridExpanderMarker(){
		resizingParentElements = {
			$top: $grid.children("div.row-fluid:last-child"),
			$bottom: null
		};

		startResizePosition = {
			top: resizingParentElements.$top.position().top + 
					resizingParentElements.$top.height(),
			left: resizingParentElements.$top.position().left
		};
		$("body").append($resizeMarker);
		$resizeMarker.css({
			height: 1,
			width: currentResizeMode.$element.width(),
			top:  canvasOffset.top + $canvas.height(),
			left: canvasOffset.left
		});
	}

	function initialVerticalResizeMarker(clickedPosition){
		resizingParentElements = {
			$top: null,
			$bottom: null
		};
		var	lastDistance = -1,
			y = clickedPosition.y;

		currentResizeMode.$element.children().each(function(index, element){
			var $child = $(element),
				bottom = $child.position().top + $child.height(),
				bottomDist = Math.abs(y-bottom);

			// First iteration
			if(lastDistance===-1){
		 		lastDistance = bottomDist;
		 		resizingParentElements.$top = $child;
			}
			// Last iteration
			else if(bottomDist>lastDistance){
				resizingParentElements.$bottom = $child;
				return false;
			}
			// Continue
			else{
				lastDistance = bottomDist;
				resizingParentElements.$top = $child;
			}
		});

		startResizePosition = {
			top: resizingParentElements.$top.position().top + 
					resizingParentElements.$top.height(),
			left: resizingParentElements.$top.position().left
		};

		$resizeMarker.css({
			height: px2Float(resizingParentElements.$top, "margin-bottom"),
			width: currentResizeMode.$element.width(),
			top:  startResizePosition.top,
			left: startResizePosition.left
		});
	}

	function initialHorizontalResizeMarker(clickedPosition){
		resizingParentElements = {
			$left: null,
			$right: null
		};
		var lastDistance = -1,
			x = clickedPosition.x;

		currentResizeMode.$element.children().each(function(index, element){
			var $child = $(element),
				right = $child.position().left + $child.width(),
				rightDist = Math.abs(x-right);

			// First iteration
			if(lastDistance===-1){
		 		lastDistance = rightDist;
		 		resizingParentElements.$left = $child;
			}
			// Last iteration
			else if(rightDist>lastDistance){
				resizingParentElements.$right = $child;
				return false;
			}
			// Continue
			else{
				lastDistance = rightDist;
				resizingParentElements.$left = $child;
			}
		});

		startResizePosition = {
			top: resizingParentElements.$right.position().top,
			left: horizontalSnap(
				resizingParentElements.$right.position().left, true)
		};

		$resizeMarker.css({
			height: currentResizeMode.$element.height(),
			width: px2Float(resizingParentElements.$right, "margin-left"),
			top:  startResizePosition.top,
			left: startResizePosition.left
		});
	}

	function moveVerticalResizeMarker(){
		$resizeMarker.css({
			top: currentMousePosition.y
		});
	}

	function moveHorizontalResizeMarker(){
		$resizeMarker.css({
			left: currentMousePosition.x
		});
	}

	function calculateVerticalResizer(){
		if($resizeMarker.position().top === startResizePosition.top)
			return;

		var resizeAmount = $resizeMarker.position().top - 
									startResizePosition.top;

		try
		{
			var topElements = findToBeVerticallyResized(
					resizingParentElements.$top, "top", resizeAmount),
				bottomElements = findToBeVerticallyResized(
					resizingParentElements.$bottom, "bottom", resizeAmount);
		}
		catch(e){
			if(e==="InvalidResizeException")
				return;
			else
				throw e;
		}

		finalizeVerticalResize(topElements, bottomElements, resizeAmount);
	}

	function calculateHorizontalResizer(){
		if($resizeMarker.position().left === 
			startResizePosition.left)
			return;

		var resizeAmount = possibleXpositions.indexOf($resizeMarker.position().left) -
							possibleXpositions.indexOf(startResizePosition.left);

		try
		{
			var leftElements = findToBeHorizontallyResized(
				resizingParentElements.$left, "left", resizeAmount),
			rightElements = findToBeHorizontallyResized(
				resizingParentElements.$right, "right", resizeAmount);
		}
		catch(e){
			if(e==="InvalidResizeException")
				return;
			else
				throw e;				
		}		

		finalizeHorizontalResize(leftElements, rightElements, resizeAmount);
	}

	function findToBeVerticallyResized($parent, side, resizeAmount, selectedElements){
		selectedElements = selectedElements || [];
		
		$parent.children("div[class^='span']").each(function(index, element){
			var $span = $(element);

			if(
				(resizeAmount>0 && side==="bottom"
				&& $span.height()-resizeAmount<30)
				||
				(resizeAmount<0 && side==="top"
				&& $span.height()+resizeAmount<30)
				)
				throw "InvalidResizeException";

			selectedElements.push($span);
			
			if(!$span.is(":empty")){
				var whichChild = "";

				if(side==="top")
					whichChild = ":last-child";
				else if(side==="bottom")
					whichChild = ":first-child";

				$span.children("div.row-fixed"+whichChild)
					.each(function(index, element){
						findToBeVerticallyResized($(element), side, 
							resizeAmount, selectedElements);
					});
			}
		});

		return selectedElements;
	}

	function findToBeHorizontallyResized($parent, side, resizeAmount, selectedElements){
		selectedElements = selectedElements || [];

		if(
			(resizeAmount>0 && side==="right"
			&& parseInt($parent.attr("data-span-type"))-resizeAmount<1)
			||
			(resizeAmount<0 && side==="left"
			&& parseInt($parent.attr("data-span-type"))+resizeAmount<1)
			)
			throw "InvalidResizeException";

		selectedElements.push($parent);

		$parent.children("div.row-fixed").each(function(index, element){
			var $row = $(element),
				whichChild = "";

			if(side==="left")
				whichChild = ":last-child";
			else if(side==="right")
				whichChild = ":first-child";

			$row.children("div[class^='span']"+whichChild)
				.each(function(index, element){
					findToBeHorizontallyResized($(element), side, resizeAmount, selectedElements);
				});
		});

		return selectedElements;
	}

	function finalizeVerticalResize(topElements, bottomElements, resizeAmount){

		iterateElements(topElements, "top");
		iterateElements(bottomElements, "bottom");
		exportMarkup();

		function iterateElements(elements, side){
			elements.forEach(function($element){
				if(side==="top")
					$element.height($element.height()+resizeAmount);
				else if(side==="bottom")
					$element.height($element.height()-resizeAmount);
			});			
		}
	}

	function finalizeHorizontalResize(leftElements, rightElements, resizeAmount){
		
		iterateElements(leftElements, "left");
		iterateElements(rightElements, "right");
		exportMarkup();

		function iterateElements(elements, side){
			elements.forEach(function($element){
				if(side==="left"){
					var oldSpanType = parseInt($element.attr("data-span-type")),
						newSpanType = oldSpanType + resizeAmount;

					$element
						.attr({
							"data-span-type": newSpanType
						})
						.removeClass("span"+oldSpanType)
						.addClass("span"+newSpanType);
				}
				else if(side==="right"){
					var oldSpanType = parseInt($element.attr("data-span-type")),
						newSpanType = oldSpanType - resizeAmount,
						newSpanStartPoint = 
							parseInt($element.attr("data-start-point")) 
									+ resizeAmount;

					$element
						.attr({
							"data-start-point": newSpanStartPoint,
							"data-span-type": newSpanType
						})
						.removeClass("span"+oldSpanType)
						.addClass("span"+newSpanType);
				}
			});			
		}
	}
}

TilingTool.HORIZONTAL_CROSSHAIRS_THICKNESS = 0;
TilingTool.VERTICAL_CROSSHAIRS_THICKNESS = 0;
TilingTool.COLUMN_UNIT = 0;
TilingTool.SLICE_MODE = {
	HORIZ: 1,
	VERT: 2
};
TilingTool.RESIZE_ACTIVATION_THRESHOLD = 5;

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