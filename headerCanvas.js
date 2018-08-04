var canvas;
var context;
var circles = [];
const colors = ['#2185C5', '#7ECEFD', '#FFF6E5', '#FF7F66'];

function onResize(){
	canvas = document.getElementById("headerCanvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight * 0.995;
	context = canvas.getContext("2d");
}

function main(){
	onResize();
	for(var i = 0; i < 100; ++i){
		var r = Math.random() * 50;
		var x = (Math.random() * (canvas.width - 2 * r)) + r;
		var y = (Math.random() * (canvas.height - 2 * r)) + r;
		var dx = Math.random() * 10 - 5;
		var dy = Math.random() * 10 - 5;
		var f = colors[Math.floor(Math.random() * colors.length)];
		circles.push(new Circle(x,y,r,f,dx,dy));
	}
	
	animate();
}

function animate(){
	window.requestAnimationFrame(animate);
	context.clearRect(0,0,canvas.width,canvas.height);
	for(var i = 0; i < circles.length; ++i){
		circles[i].update();
	}
}

function Circle (x, y, radius, fill, dx, dy){
	this.x = x;
	this.y = y;
	this.r = radius;
	this.f = fill;
	this.dx = dx;
	this.dy = dy;
	
	this.draw = function () {
		context.beginPath();
		context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		context.fillStyle = this.f;
		context.fill();
	}
	
	this.animate = function (){
		this.x += this.dx;
		this.y += this.dy;
		
		if(this.x < this.r || this.x > canvas.width - this.r) {
			this.dx = -this.dx;
		}
		if(this.y < this.r || this.y > canvas.height - this.r) {
			this.dy = -this.dy;
		}
		
		this.collision();
	}
	
	this.collision = function (){
		for(var i = 0; i < circles.length; ++i){
			var cir = circles[i];
			if(cir === this) break;
			var dist = Math.sqrt(Math.pow(cir.x - this.x, 2) + Math.pow(cir.y - this.y, 2));
			if(dist < this.r + cir.r){
				
			}
		}
	}
	
	this.update = function (){
		this.draw();
		this.animate();
	}
}