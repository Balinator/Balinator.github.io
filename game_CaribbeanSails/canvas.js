let canvas;
let context;
let map;

let mouseX;
let mouseY;

let selectedConvoy;

function onScroll(event) {
    map.scrollUpDown(event.deltaY / 1000.0);
}

function onMouseMove(event) {
    mouseX = event.x;
    mouseY = event.y;
}

function onMouseClick(event) {
    let coordinates = map.getCoordinatesOfScreen(event.x, event.y);
    selectedConvoy.destinationX = coordinates.x;
    selectedConvoy.destinationY = coordinates.y;
}

function minMax(min, val, max) {
    if(max < min) {
        throw new Error("Number not valid!");
    }
    return Math.min(max, Math.max(min, val));
}

function onResize(){
    canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context = canvas.getContext("2d");
}

function main(){
    onResize();
    initialize();
    animate();
}

function initialize() {
    let img = document.getElementById("background");
    let pixel = document.getElementById("background-pixel");
    map = new Map(img, pixel);
    selectedConvoy = map.convois[0];
}

function animate() {
    logic();
    drawMap();
    window.requestAnimationFrame(animate);
}

function logic() {
    map.moveMouse(mouseX, mouseY);
}

function drawMap(){
    context.clearRect(0,0,canvas.width,canvas.height);
    map.drawMap();
}

function Map(visibleMap, pixelMap) {
    this.visibleMap = visibleMap;

    let pixelCanvas = document.createElement('canvas');
    pixelCanvas.width = pixelMap.width;
    pixelCanvas.height = pixelMap.height;
    this.pixelMap = pixelCanvas.getContext('2d');
    this.pixelMap.drawImage(pixelMap, 0, 0);

    this.x = 0;
    this.y = 0;
    this.viewPortX = window.innerWidth;
    this.viewPortY = window.innerHeight;
    this.width = this.visibleMap.width;
    this.height = this.visibleMap.height;

    this.towns = [new Town(252, 476, 50, '#ff4477')];
    this.convois = [new Convoy(300, 500, 30, '#00ff35')];

    this.scroll = 2.8;
    const maxScroll = 3;
    const minScroll = 0.5;

    this.getPixel = function(x, y){
        return this.pixelMap.getImageData(x, y, 1, 1).data;
    };

    this.getPixelOnScreen = function(x, y){
        return this.getPixel(this.x + x * this.scroll,this.y + y * this.scroll);
    };

    this.getPixelOnMouse = function(){
        return this.getPixelOnScreen(mouseX, mouseY);
    };

    this.drawMap = function () {
        context.drawImage(this.visibleMap,
            this.x, this.y, this.viewPortX * this.scroll, this.viewPortY * this.scroll,
            0, 0, this.viewPortX, this.viewPortY);
        for(let key in this.towns){
            let town = this.towns[key];
            town.draw();
        }
        for(let key in this.convois){
            let convoy = this.convois[key];
            convoy.animate();
        }

        let color = this.getPixelOnMouse();
        context.fillText("r: " + color[0] + "\ng: " + color[1] + "\nb: " + color[2] + "a: " + color[3], 10, 10);
    };

    this.scrollUpDown = function (num) {
        this.x += mouseX * this.scroll;
        this.y += mouseY * this.scroll;

        this.scroll += num;
        this.scroll = minMax(minScroll, this.scroll, maxScroll);

        this.x -= mouseX * this.scroll;
        this.y -= mouseY * this.scroll;

        try {
            this.x = minMax(0, this.x, this.width - this.viewPortX * this.scroll);
            this.y = minMax(0, this.y, this.height - this.viewPortY * this.scroll);
        } catch (e) {
            let newSX = this.width / this.viewPortX;
            let newSY = this.height / this.viewPortY;

            this.x += mouseX * this.scroll;
            this.y += mouseY * this.scroll;

            this.scroll = newSX < newSY ? newSX : newSY;

            this.x -= mouseX * this.scroll;
            this.y -= mouseY * this.scroll;

            this.x = minMax(0, this.x, this.width - this.viewPortX * this.scroll);
            this.y = minMax(0, this.y, this.height - this.viewPortY * this.scroll);
        }
    };


    this.moveMouse = function (x, y) {
        if(x < 10) {
            this.move(-1, 0);
        } else if (x > window.innerWidth - 10) {
            this.move(1, 0);
        }
        if(y < 10) {
            this.move(0, -1);
        } else if (y > window.innerHeight - 10) {
            this.move(0, 1);
        }
    };

    this.move = function (x, y) {
        if(x < 0) {
            this.x -= 10 * this.scroll;
        } else if (x > 0) {
            this.x += 10 * this.scroll;
        }
        if(y < 0) {
            this.y -= 10 * this.scroll;
        } else if (y > 0) {
            this.y += 10 * this.scroll;
        }

        this.x = minMax(0, this.x, this.width - this.viewPortX * this.scroll);
        this.y = minMax(0, this.y, this.height - this.viewPortY * this.scroll);
    };

    this.getCoordinatesOfScreen = function(x, y){
        return {
            x: this.x + x * this.scroll,
            y: this.y + y * this.scroll
        };
    };

    this.getCoordinates = function(x, y, r = 0) {
        return {
            x: x / this.scroll - this.x / this.scroll,
            y: y / this.scroll - this.y / this.scroll,
            r: r / this.scroll
        };
    }
}

function Town (x, y, radius, fill){
    this.x = x;
    this.y = y;
    this.r = radius;
    this.f = fill;

    this.draw = function () {
        context.beginPath();
        let coordinate = map.getCoordinates(this.x, this.y, this.r);
        context.arc(coordinate.x, coordinate.y, coordinate.r, 0, 2 * Math.PI);
        context.fillStyle = this.f;
        context.fill();
    };
}

function Convoy (x, y, radius, fill){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fill = fill;

    this.destinationX = 1000;
    this.destinationY = 1000;

    this.speed = 8;

    this.draw = function () {
        context.beginPath();
        let coordinate = map.getCoordinates(this.x, this.y, this.radius);
        context.arc(coordinate.x, coordinate.y, coordinate.r, 0, 2 * Math.PI);
        context.fillStyle = this.fill;
        context.fill();
    };

    this.update = function () {
        let disX = this.destinationX - this.x;
        let disY = this.destinationY - this.y;
        let magnitude = Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2));
        if(magnitude > this.speed) {
            this.x = this.x + (disX / magnitude * this.speed);
            this.y = this.y + (disY / magnitude * this.speed);
        }
    };

    this.animate = function(){
        this.update();
        this.draw(this.x, this.y, this.radius, this.fill);
    }
}