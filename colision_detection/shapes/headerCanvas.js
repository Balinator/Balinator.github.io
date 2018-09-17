const colors = [[32, 133, 197],[126, 206, 253], [255, 246, 229], [255, 127, 102]];

var canvas;
var context;
var shape;

var mouseDetected = false;
var mouseX;
var mouseY;

function onMouseMove(e){
	mouseDetected = true;
	mouseX = e.clientX;
	mouseY = e.clientY;
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
	var xs = [];
	var ys = [];
	for(var i = 0; i < 10; ++i){
		var x = Math.random() * canvas.width;
		var y = Math.random() * canvas.height;
		xs.push(x);
		ys.push(y);
	}
	shape = new Shape(xs, ys, colors[0], colors[1]);
	
	animate();
}

function animate(){
	context.clearRect(0, 0, canvas.width, canvas.height);
	shape.update();
	window.requestAnimationFrame(animate);
}

function Shape (x, y, fillNotDetected, fillDetected){
	this.x = x;
	this.y = y;
	this.fillNotDetected = fillNotDetected;
	this.fillDetected = fillDetected;
	this.collided = false;
	
	this.draw = function () {
		context.beginPath();
		context.moveTo(this.x[0], this.y[0]);
		for (var i = 1; i < this.x.length; ++i) {
			context.lineTo(this.x[i], this.y[i]);
		}
		if(this.collided){
			context.fillStyle = 'rgba(' + this.fillDetected[0] + ', ' + this.fillDetected[1] + ', ' + this.fillDetected[2] + ')';
		} else {
			context.fillStyle = 'rgba(' + this.fillNotDetected[0] + ', ' + this.fillNotDetected[1] + ', ' + this.fillNotDetected[2] + ')';
		}
		context.closePath()
		context.fill();
		context.stroke();
	}
	
	this.collision = function (){
		this.drawLine();
		var count = 0;
		for(var i = 0; i < this.x.length; ++i) {
			if (this.getIntersection(mouseX, mouseY, 0, 0, x[(i + x.length - 1) % x.length], y[(i + x.length - 1) % x.length], x[i], y[i])){
				++count;
			}
		}
		this.collided = count % 2 == 1;
	}
	
	this.getIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
		var x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4))
				/ ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
		var y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4))
				/ ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
		var xx1 = x3 < x4 ? x3 : x4;
		var xx2 = x3 > x4 ? x3 : x4;
		var yy1 = y3 < y4 ? y3 : y4;
		var yy3 = y3 > y4 ? y3 : y4;

		if (x >= xx1 && x <= xx2 && y >= yy1 && y <= yy3) {
			this.drawCircles(x, y);
			if(x < mouseX && y < mouseY) {
				return true;
			}
		}
		return false;
	}
	
	this.drawCircles = function (x, y) {
		context.beginPath();
		context.arc(x, y, 3, 0, 2 * Math.PI);
		context.closePath();
		context.stroke();
	}
	
	this.drawLine = function () {
		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(mouseX, mouseY);
		context.stroke();
	}
	
	this.update = function (){
		this.draw();
		this.collision();
	}
}