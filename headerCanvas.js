const colors = ['#2185C5', '#7ECEFD', '#FFF6E5', '#FF7F66'];

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
}

function onMouseDown(e){
	mouseDetected = true;
	mouseX = e.clientX;
	mouseY = e.clientY;
	for(var i = 0; i < circles.length; ++i){
		circles[i].handleClick();
	}
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
	for(var i = 0; i < 200; ++i){
		var r = Math.random() * 50;
		var x = (Math.random() * (canvas.width - 2 * r)) + r;
		var y = (Math.random() * (canvas.height - 2 * r)) + r;
		var dx = (Math.random() - 0.5) * 5;
		var dy = (Math.random() - 0.5) * 5;
		var f = colors[Math.floor(Math.random() * colors.length)];
		circles.push(new Circle(x,y,r,f,dx,dy));
	}
	
	animate();
}

function animate(){
	context.clearRect(0,0,canvas.width,canvas.height);
	for(var i = 0; i < circles.length; ++i){
		circles[i].update();
	}
	window.requestAnimationFrame(animate);
}

function hexToRgbA(hex, o){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',' + o +')';
    }
    throw new Error('Bad Hex');
}

function Circle (x, y, radius, fill, dx, dy){
	this.x = x;
	this.y = y;
	this.r = radius;
	this.f = fill;
	this.dx = dx;
	this.dy = dy;
	this.o = 1;
	this.edx = 0;
	this.edy = 0;
	
	this.draw = function () {
		context.beginPath();
		context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		context.fillStyle = hexToRgbA(this.f, this.o);
		context.fill();
	}
	
	this.animate = function (){
		this.x += this.dx + this.edx;
		this.y += this.dy + this.edy;
		
		if(this.x < this.r) {
			this.dx = Math.abs(this.dx);
			this.edx = (this.r - this.x) * 0.1;
		} else if(this.x > canvas.width - this.r) {
			this.dx = -Math.abs(this.dx);
			this.edx = (-(this.x - (canvas.width - this.r))) * 0.1;
		}
		if(this.y < this.r) {
			this.dy = Math.abs(this.dy);
			this.edy = (this.r - this.y) * 0.1;
		} else if(this.y > canvas.height - this.r) {
			this.dy = -Math.abs(this.dy);
			this.edy = (-(this.y - (canvas.height - this.r))) * 0.1;
		}
		
		//this.collision();
		this.mouseEffect();
	}
	
	this.collision = function (){
		for(var i = 0; i < circles.length; ++i){
			var cir = circles[i];
			if(cir === this) break;
			var dist_2 = Math.pow(cir.x - this.x, 2) + Math.pow(cir.y - this.y, 2);
			
			if(dist_2 < Math.pow(this.r + cir.r, 2)){
				this.o = Math.max(this.o - 0.2, 0.3);
			} else {
				this.o = Math.min(this.o + 0.2, 1);
			}
			cir.o = this.o;
		}
	}
	
	this.mouseEffect = function (){
		if(mouseDetected){
			var dist = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
			if(dist < 100){
				this.edx += (mouseX - this.x) / 40;
				this.edy += (mouseY - this.y) / 40;
			} else {
				this.edx *= 0.8;
				this.edy *= 0.8;
			}
		} else {
			this.edx *= 0.8;
			this.edy *= 0.8;
		}
	}
	
	this.handleClick = function(){
		var dist = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
		if(dist < Math.max(canvas.width, canvas.height) / 4){
			this.edx = -(mouseX - this.x) / dist * 30;
			this.edy = -(mouseY - this.y) / dist * 30;
		}
	}
	
	this.update = function (){
		this.draw();
		this.animate();
	}
}