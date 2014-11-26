function GridGen($wrapper){
	var self = this,
		allTiles = [],
		fluidRows = [];

	Span.TYPES = {}

	init();

	function init() {
		prepareSpanTypes();
		extractAllTiles();
	}

	function prepareSpanTypes(){
		for(var i=1; i<=12; i++){
			var width = Math.round( (TilingTool.COLUMN_UNIT * i) +
								(TilingTool.CROSSHAIRS_THICKNESS * (i-1) ) );
			Span.TYPES[i] = width;
		}
		console.log(Span.TYPES);
	}

	function extractAllTiles(){
		$wrapper.find("div.tile").each(function(){
			var $tile = $(this),
				span = new Span($tile);
		});
		// $wrapper.find("div").not(".tile").hide();
	}
}