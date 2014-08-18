
var brush_canvas = E("canvas");
var brush_ctx = brush_canvas.getContext("2d");
var brush_shape = "circle";
var brush_size = 5;
var eraser_size = 8;
var airbrush_size = 9;
var pencil_size = 1;
var stroke_size = 1; // lines, curves, shape outlines
var transparent_opaque = "opaque";

var render_brush = function(ctx, shape, size){
	if(shape === "circle"){
		size /= 2;
		size += 0.25;
	}else if(shape.match(/diagonal/)){
		size -= 0.4;
	}
	
	var mid_x = ctx.canvas.width / 2;
	var left = ~~(mid_x - size/2);
	var right = ~~(mid_x + size/2);
	var mid_y = ctx.canvas.height / 2;
	var top = ~~(mid_y - size/2);
	var bottom = ~~(mid_y + size/2);
	
	if(shape === "circle"){
		draw_ellipse(ctx, left, top, size, size);
	}else if(shape === "square"){
		ctx.fillRect(left, top, ~~size, ~~size);
	}else if(shape === "diagonal"){
		draw_line(ctx, left, top, right, bottom);
	}else if(shape === "reverse_diagonal"){
		draw_line(ctx, left, bottom, right, top);
	}else if(shape === "horizontal"){
		draw_line(ctx, left, mid_y, size, mid_y);
	}else if(shape === "vertical"){
		draw_line(ctx, mid_x, top, mid_x, size);
	}
};

var $Choose = function(things, display, choose, is_chosen){
	var $chooser = $(E("div")).addClass("jspaint-chooser");
	$chooser.on("update", function(){
		$chooser.empty();
		for(var i=0; i<things.length; i++){
			(function(thing){
				var $option_container = $(E("div")).appendTo($chooser);
				var $option = $();
				var choose_thing = function(){
					if(is_chosen(thing)){
						return; //optimization
					}
					choose(thing);
					$G.trigger("option-changed");
				}
				var update = function(){
					$option_container.css({
						backgroundColor: is_chosen(thing) ? "rgb(0, 0, 123)" : ""
					});
					$option_container.empty();
					$option = $(display(thing, is_chosen(thing)));
					$option.appendTo($option_container);
				};
				update();
				$chooser.on("redraw", update);
				$G.on("option-changed", update);
				
				$option_container.on("mousedown click", choose_thing);
				$chooser.on("mousedown", function(){
					$option_container.on("mouseenter", choose_thing);
				});
				$(window).on("mouseup", function(){
					$option_container.off("mouseenter", choose_thing);
				});
				
			})(things[i]);
		}
	});
	return $chooser;
};
var $ChooseShapeStyle = function(){
	var $chooser = $Choose(
		[
			[1, 0], [1, 1], [0, 1]
		],
		function(a, is_chosen){
			var canvas = E("canvas");
			var ctx = canvas.getContext("2d");
			
			canvas.width = 39;
			canvas.height = 21;
			var b = 5;
			
			ctx.fillStyle = is_chosen ? "#fff" : "#000";
			
			if(a[0]){
				ctx.fillRect(b, b, canvas.width-b*2, canvas.height-b*2);
			}
			b++;
			ctx.fillStyle = "#777";
			if(a[1]){
				ctx.fillRect(b, b, canvas.width-b*2, canvas.height-b*2);
			}else{
				ctx.clearRect(b, b, canvas.width-b*2, canvas.height-b*2);
			}
			
			return canvas;
		},
		function(a){
			$chooser.stroke = a[0];
			$chooser.fill = a[1];
		},
		function(a){
			if($chooser.fill === undefined) $chooser.fill = 0;
			if($chooser.stroke === undefined) $chooser.stroke = 1;
			return $chooser.stroke === a[0] && $chooser.fill === a[1];
		}
	).addClass("jspaint-choose-shape-style");
	
	return $chooser;
};

var $choose_brush = $Choose(
	(function(){
		var brush_shapes = ["circle", "square", "reverse_diagonal", "diagonal"];
		var brush_sizes = [8, 5, 2];
		var things = [];
		for(var brush_shape_i in brush_shapes){
			for(var brush_size_i in brush_sizes){
				things.push({
					shape: brush_shapes[brush_shape_i],
					size: brush_sizes[brush_size_i],
				});
			}
		}
		return things;
	})(), 
	function(o, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		var shape = o.shape;
		var size = o.size;
		if(shape === "circle"){
			size -= 1;
		}
		
		canvas.width = canvas.height = 10;
		
		ctx.fillStyle = ctx.strokeStyle = is_chosen ? "#fff" : "#000";
		render_brush(ctx, shape, size);
		
		return canvas;
	},
	function(o){
		brush_shape = o.shape;
		brush_size = o.size;
	},
	function(o){
		return brush_shape === o.shape && brush_size === o.size;
	}
).addClass("jspaint-choose-brush");

var $choose_eraser_size = $Choose(
	[4, 6, 8, 10],
	function(size, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		canvas.width = 39;
		canvas.height = 16;
		
		ctx.fillStyle = is_chosen ? "#fff" : "#000";
		render_brush(ctx, "square", size);
		
		return canvas;
	},
	function(size){
		eraser_size = size;
	},
	function(size){
		return eraser_size === size;
	}
).addClass("jspaint-choose-eraser");

var $choose_stroke_size = $Choose(
	[1, 2, 3, 4, 5],
	function(size, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		canvas.width = 39;
		canvas.height = 12;
		
		ctx.fillStyle = is_chosen ? "#fff" : "#000";
		ctx.fillRect(5, ~~((canvas.height-size)/2), canvas.width-5-5, size);
		
		return canvas;
	},
	function(size){
		stroke_size = size;
	},
	function(size){
		return stroke_size === size;
	}
).addClass("jspaint-choose-stroke-size");

var $choose_magnification = $Choose(
	[1, 2, 6, 8/*, 10*/],
	function(size, is_chosen){
		var canvas = E("canvas");
		var ctx = canvas.getContext("2d");
		
		canvas.width = 39;
		canvas.height = 12;
		
		ctx.fillStyle = is_chosen ? "#fff" : "#000";
		
		ctx.translate(5, 0);
		render_brush(ctx, "square", size);
		
		ctx.textBaseline = "middle";
		ctx.textAlign = "right";
		ctx.fillText(size+"x", 10, canvas.height/2);
		
		return canvas;
	},
	function(size){
		
	},
	function(size){
		return size === 1;
	}
).addClass("jspaint-choose-magnification");

var airbrush_sizes = [9, 16, 24];
var $choose_airbrush_size = $Choose(
	airbrush_sizes,
	function(size, is_chosen){
		var e = E("div");
		var sprite_width = 72;
		var pos = airbrush_sizes.indexOf(size) / airbrush_sizes.length * -sprite_width;
		var is_bottom = size === 24;
		var _ = 4 * !is_bottom;
		$(e).css({
			backgroundImage: "url(images/options-airbrush-size.png)",
			backgroundPosition: pos - _ + "px 0px",
			width: (72 / 3 - _*2) + "px",
			height: "23px",
			filter: is_chosen ? "invert()" : "",
			msFilter: is_chosen ? "invert()" : "",
			mozFilter: is_chosen ? "invert()" : "",
			webkitFilter: is_chosen ? "invert()" : "" // @todo: invert and upscale with canvas
		});
		return e;
	},
	function(size){
		airbrush_size = size;
	},
	function(size){
		return size === airbrush_size;
	}
).addClass("jspaint-choose-airbrush-size");

var $choose_transparency = $Choose(
	["opaque", "transparent"],
	function(t_o, is_chosen){
		var e = E("div");
		$(e).css({
			backgroundImage: "url(images/options-transparency.png)",
			backgroundPosition: "0px "+(t_o === "opaque" ? 0 : 23)+"px",
			width: "35px",
			height: "23px",
			margin: "2px"
		});
		return e;
	},
	function(t_o){
		transparent_opaque = t_o;
	},
	function(t_o){
		return t_o === transparent_opaque;
	}
).addClass("jspaint-choose-transparency");
