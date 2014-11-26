function Span($element){
	var self = this,
		type = 0;
		
	init();

	function init(){
		var width = Math.round( $element.width() );
		for(var typeNum in Span.TYPES){
			if(width===Span.TYPES[typeNum])
				type = typeNum;
		}
		console.log($element[0]);
		console.log(type);
	}
}