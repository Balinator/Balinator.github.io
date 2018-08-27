var DirectionEnum = Object.freeze({ "n":new Direction(0, 1), "ne":new Direction(1, 1), "e":new Direction(1, 0), "se":new Direction(1, -1), "s":new Direction(0, -1), "sw":new Direction(-1, -1), "w":new Direction(-1, 0), "nw":new Direction(-1, 1) });
var DIRECTIONS = Object.values(DirectionEnum);

function Direction(x, y) {
	this.x = x;
	this.y = y;
	this.hardness = Math.sqrt(Math.abs(x) + Math.abs(y));
}

var StateEnum = Object.freeze({ "free":1, "path":0.1, "wall":99999});

var canvas;
var context;
var map;
var isCustomMap = false;

function onMouseDown(e){
	if(isCustomMap) {
		var x = Math.floor(e.clientX / map.rect);
		var y = Math.floor(e.clientY / map.rect);
		switch (e.button){
			case 0:
				if(map.grid[x][y].state != StateEnum.free) {
					map.grid[x][y].state = StateEnum.free;
				} else {
					map.grid[x][y].state = StateEnum.path;
				}
				break;
			case 2:
				if(map.grid[x][y].state != StateEnum.free) {
					map.grid[x][y].state = StateEnum.free;
				} else {
					map.grid[x][y].state = StateEnum.wall;
				}
				break;
			default:
				isCustomMap = false;
		}
	} else {
		switch (e.button){
			case 0:
				isCustomMap = false;
				break;
			case 2:
				isCustomMap = true;
				break;
			default:
		}
		generateMap();
	}
}

function onResize(){
	canvas = document.getElementById("headerCanvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight * 0.995;
	context = canvas.getContext("2d");
}

function main(){
	onResize();
	generateMap();
	
	animate();
}

function generateMap(){
	map = new Map(canvas.width, canvas.height, 50, '#eeeeee', '#00ff00', '#333333', '#0000ff', '#ff00ff', '#ff0000', 0.5);
	map.generateMap();
}

function animate(){
	map.update();
	
	window.requestAnimationFrame(animate);
}

function Map (x, y, rect, fillEmptyField, fillPathField, fillWallField, fillNoSearch, fillSearch, fillBestSearch, procent){
	this.x = x;
	this.y = y;
	this.rect = rect;
	
	this.fillEmptyField = fillEmptyField;
	this.fillPathField = fillPathField;
	this.fillWallField = fillWallField;
	this.fillNoSearch = fillNoSearch;
	this.fillSearch = fillSearch;
	this.fillBestSearch = fillBestSearch;
	
	this.grid;
	this.procent = procent;
	this.done;
	this.avabils;
	this.stop;
	this.start;
	this.ok = true;
	
	this.generateMap = function () {
		if (this.procent < 0 || this.procent > 1) {
			console.log("Procent with bad argument! (must be 0 < procent < 1)");
			this.ok = false;
			return;
		}
		
		this.grid = [];
		for (var i = 0; i < Math.floor(this.x / this.rect); ++i) {
			var inner = [];
			for (var j = 0; j < Math.floor(this.y / this.rect); ++j) {
				if(!isCustomMap){
					var r = Math.floor(Math.random() * 100);
					if (r < 25) {
						r = StateEnum.path;
					}else if (r > 100 - 25) {
						r = StateEnum.wall;
					} else {
						r = StateEnum.free;
					}
				} else {
					r = StateEnum.free;
				}
				inner.push(new Field(i, j, r));
			}
			this.grid.push(inner);
		}
		this.grid[0][0].state = StateEnum.path;
		this.grid[Math.floor(this.x / this.rect) - 1][Math.floor(this.y / this.rect) - 1].state = StateEnum.path;
		
		this.stop = this.grid[this.grid.length - 1][this.grid[0].length - 1];
		this.start = this.grid[0][0];
		this.start.search = 1;
		
		if (this.start.search === 2 || this.stop.search === 2) {
			console.log("Start or End point not avabil!");
			this.ok = false;
			return;
		}
		this.done = [];
		this.avabils = [];
		this.avabils.push(this.start);
	}
	
	this.draw = function () {
		for (var i = 0; i < this.grid.length; ++i) {
			for (var j = 0; j < this.grid[0].length; ++j) {
				context.beginPath();
				context.rect(i * this.rect + 0.5, j * this.rect + 0.5, this.rect - 1, this.rect - 1);
				switch(this.grid[i][j].state){
					case StateEnum.path: 
						context.fillStyle = this.fillPathField;
						break;
					case StateEnum.wall:
						context.fillStyle = this.fillWallField;
						break;
					default:
						context.fillStyle = this.fillEmptyField;
				}
				context.lineWidth = 1;
				context.strokeStyle = '#000000';
				context.fill();
				context.stroke();
				
				if(this.grid[i][j].search !== 0) {
					context.beginPath();
					context.rect(i * this.rect + this.rect / 4, j * this.rect + this.rect / 4, this.rect / 2, this.rect / 2);
					context.fillStyle = this.grid[i][j].search === 1 ? this.fillSearch : this.fillBestSearch;
					context.fill();
				}
			}
		}
	}
	
	this.search = function (){
		if (!this.ok) { return; }
		
		var min = null;
		var minDist = Number.MAX_VALUE;
		for (var i = 0; i < this.avabils.length; ++i) {
			var f = this.avabils[i];
			if (f.distance < 0) {
				f.distance = Math.sqrt(Math.pow(Math.abs(f.x - this.stop.x), 2) + Math.pow(Math.abs(f.y - this.stop.y), 2));
			}
			var dist = f.route * this.procent + f.distance;
			if (dist < minDist) {
				min = f;
				minDist = dist;
			}
		}

		if (min == null) {
			console.log("No minimum found!");
			if (this.avabils.length === 0){
				this.ok = false;
				if (!this.done.includes(this.stop)) {
					console.log("No possible route!");
				}
			}
			return;
		}
		
		min.search = 1;

		this.avabils.splice(this.avabils.indexOf(min),1);
		this.done.push(min);

		for (var i = 0; i < DIRECTIONS.length; ++i) {
			var direction = DIRECTIONS[i];
			if (this.grid[min.x + direction.x] !== undefined) {
				var f = this.grid[min.x + direction.x][min.y + direction.y];
				if (f != null && f != undefined && f.state !== StateEnum.wall && !this.done.includes(f)) {
					if (!this.avabils.includes(f)) {
						this.avabils.push(f);
						f.parent = min;
						f.route = f.parent.route + direction.hardness + f.state;
					} else if (f.parent.route > min.route) {
						f.parent = min;
						f.route = f.parent.route + direction.hardness + f.state;
					}
				}
			}
		}
		
		if (this.done.includes(this.stop)) {
			console.log(this.stop.route);
			this.ok = false;
			var f = this.stop;
			f.search = 2;
			while(f.parent !== null){
				f = f.parent;
				f.search = 2;
			}
		}
	}
	
	this.update = function (){
		this.draw();
		if(!isCustomMap){
			this.search();
		}
	}
}

function Field (x, y, state) {
	this.state = state;
	this.search = 0; 
	
	this.x = x;
	this.y = y;
	this.distance = -1;
	this.parent = null;
	this.route = 0;
}
