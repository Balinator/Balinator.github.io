const colors = [[32, 133, 197],[126, 206, 253], [255, 246, 229], [255, 127, 102]];

var canvas;
var context;
var circles = [];
var mouseDetected = false;
var mouseX;
var mouseY;

function onMouseMove(e){
	mouseDetected = true;
	mouseX = e.clientX;
	mouseY = e.clientY;
	
	circles[circles.length - 1].x = mouseX;
	circles[circles.length - 1].y = mouseY;
}

function onMouseLeave(){
	mouseDetected = false;
}

function onResize(){
	canvas = document.getElementById("headerCanvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight * 0.995;
	context = canvas.getContext("2d");
}

function main(){
	onResize();
	for(var i = 0; i < 100; ++i){
		var r = Math.random() * 40 + 10;
		var x = (Math.random() * (canvas.width - 2 * r)) + r;
		var y = (Math.random() * (canvas.height - 2 * r)) + r;
		var dx = (Math.random() - 0.5) * 5 * 0;
		var dy = (Math.random() - 0.5) * 5 * 0;
		var f = colors[Math.floor(Math.random() * colors.length)];
		circles.push(new Circle(x,y,r,f,dx,dy));
	}
	
	animate();
}

function animate(){
	context.clearRect(0, 0, canvas.width, canvas.height);
	for(var i = 0; i < circles.length; ++i){
		circles[i].update();
	}
	circles[circles.length - 1].collision();
	window.requestAnimationFrame(animate);
}

function Circle (x, y, radius, fill, dx, dy){
	this.x = x;
	this.y = y;
	this.r = radius;
	this.f = fill;
	this.o = 1;
	
	this.draw = function () {
		context.beginPath();
		context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		context.fillStyle = 'rgba(' + this.f[0] + ', ' + this.f[1] + ', ' + this.f[2] + ', ' + this.o + ')';
		context.fill();
	}
	
	this.collision = function (){
		var count = 0;
		for(var i = 0; i < circles.length; ++i){
			var cir = circles[i];
			if(cir === this) continue;
			var dist_2 = Math.pow(cir.x - this.x, 2) + Math.pow(cir.y - this.y, 2);
			
			if(dist_2 < Math.pow(this.r + cir.r, 2)){
				count++;
			}
		}
		if(count > 0){
			this.o = Math.max(this.o - 0.05, 0.3);
		} else {
			this.o = Math.min(this.o + 0.05, 1);
		}
	}
	
	this.update = function (){
		this.draw();
		this.collision();
	}
}