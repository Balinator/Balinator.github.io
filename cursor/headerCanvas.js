const colors = ['#2185C5', '#7ECEFD', '#FFF6E5', '#FF7F66'];

const mainCircleSize = 10;
const smallCircleSize = 5;
var canvas;
var context;
var mainCircle;
var circles = [];

const minNum = 20;
const maxNum = 50;
const close = 15;
const far = 50;
var distance;

const speed = 3;
const speedRandomRatio = 0.2;
const speedExtraRatio = 0.008;
const speedRatio = 0.85;

const wait = 3000;
const fadeTime = 0.05;
var startTime;

var mouseDetected = false;
var mouseX;
var mouseY;
var lastScrolledLeft = 0;
var lastScrolledTop = 0;

function onClick(){
	startTime = Date.now();
}

function onMouseMove(e){
	startTime = Date.now();
	mouseDetected = true;
	
	mouseX = e.clientX;
	mouseY = e.clientY;
	
	updateMainCirclePosition();
}

function updateMainCirclePosition(){
	var rect = canvas.getBoundingClientRect();
	mainCircle.x = mouseX - rect.left;
	mainCircle.y = mouseY - rect.top;
}

function onScroll(e){
	startTime = Date.now();
	mouseDetected = true;
	updateMainCirclePosition();
}

function onMouseLeave(){
	startTime = Date.now();
	mouseDetected = false;
}

function onMouseEnter(){
	startTime = Date.now();
	mouseDetected = true;
}

function onResize(){
	var body = document.body,
    html = document.documentElement;
	var height = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );
					   
	canvas = document.getElementById("headerCanvas");
	canvas.width = body.scrollWidth;
	canvas.height = body.scrollHeight;
	context = canvas.getContext("2d");
}

function main(){
	startTime = Date.now();
	onResize();
	mainCircle = new Circle(0, 0, mainCircleSize, colors[randomInt(0,colors.length)], 0, 0);
	for(var i = 0; i < minNum; ++i) {
		circles.push(createNewCirecle());
	}
	animate();
}

function createNewCirecle() {
	return new Circle(mainCircle.x, mainCircle.y, smallCircleSize, colors[randomInt(0,colors.length)], randomDouble(-speed, speed), randomDouble(-speed, speed));
}

function animate(){
	context.clearRect(0, 0, canvas.width, canvas.height);
	distance = 0;
	for(var i = 0; i < circles.length; ++i){
		circles[i].update();
	}
	mainCircle.draw();
	
	var ratio = distance / circles.length;
	if(circles.length > minNum && ratio < close) {
		circles.pop();
	} else if(ratio > far) {
		circles.push(createNewCirecle());
		if(circles.length >= maxNum) {
			circles.shift();
		}
	}
	console.log(distance + ' ' + circles.length);
	console.log(ratio);
	window.requestAnimationFrame(animate);
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
		if(mouseDetected && Date.now() - startTime < wait){
			this.o = Math.min(1, this.o + fadeTime);
		}else{
			this.o = Math.max(0, this.o - fadeTime);
		}
		if(this.o > 0){
			context.beginPath();
			context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
			context.fillStyle = hexToRgbA(this.f, this.o);
			context.fill();
		}
	}
	
	this.animate = function (){
		if(isNaN(this.x)){
			this.x = mainCircle.x;
			this.dx = randomDouble(-speed, speed);
			this.edx = 0;
		}
		if(isNaN(this.y)){
			this.y = mainCircle.y;
			this.dy = randomDouble(-speed, speed);
			this.edy = 0
		}
		
		this.edx = this.x - mainCircle.x;
		this.edy = this.y - mainCircle.y;
		
		distance += Math.sqrt(this.edx * this.edx + this.edy * this.edy);
		
		this.dx = (this.dx - this.edx * speedExtraRatio) * speedRatio + randomDouble(-speed,speed) * speedRandomRatio;
		this.dy = (this.dy - this.edy * speedExtraRatio) * speedRatio + randomDouble(-speed,speed) * speedRandomRatio;
		
		this.x += this.dx;
		this.y += this.dy;
	}
	
	this.update = function (){
		this.draw();
		this.animate();
	}
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

function randomInt(start, end) {
	return Math.floor(randomDouble(start, end));
}

function randomDouble(start, end) {
	return Math.random() * (end - start) + start;
}

function minMax(val ,min, max) {
	return Math.max(Math.min(val, max), min);
}