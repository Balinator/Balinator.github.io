class IdManager {
    static nextId = 0;

    static getNextId() {
        return IdManager.nextId++;
    }
}
class UtilFunctions {
    static minMax(min, val, max) {
        if (max < min) {
            throw new Error("Number not valid!");
        }
        return Math.min(max, Math.max(min, val));
    }
}

let canvas;
let context;
let map;

let mouseX;
let mouseY;

let selectedElement = null;

function onScroll(event) {
    map.scrollUpDown(event.deltaY / 1000.0);
}

function onMouseMove(event) {
    mouseX = event.x;
    mouseY = event.y;
}

function onKeyDown(event) {
    console.log(event.key);
    switch (event.key) {
        case 'W':
        case 'w':
        case 'ArrowUp':
            map.move(0, -1);
            break;
        case 'S':
        case 's':
        case 'ArrowDown':
            map.move(0, 1);
            break;
        case 'A':
        case 'a':
        case 'ArrowLeft':
            map.move(-1, 0);
            break;
        case 'D':
        case 'd':
        case 'ArrowRight':
            map.move(1, 0);
            break;
        case 'Q':
        case 'q':
        case '+':
            map.scrollUpDown(-0.1);
            break;
        case 'E':
        case 'e':
        case '-':
            map.scrollUpDown(0.1);
            break;
    }
}

document.oncontextmenu = function () {
    return false;
};

function onMouseClick(event) {
    let coordinates = map.getCoordinatesOfScreen(event.x, event.y);

    switch (event.button) {
        case 0:
            selectedElement = map.getSelected(coordinates);
            break;
        case 1:
            console.log(event);
            break;
        case 2:
            if (selectedElement !== null) {
                selectedElement.destinationX = coordinates.x;
                selectedElement.destinationY = coordinates.y;
            }
            break;
    }
}

function onResize() {
    canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context = canvas.getContext("2d");
}

function main() {
    onResize();
    initialize();
    animate();
}

function initialize() {
    let img = document.getElementById("background");
    let pixel = document.getElementById("background-pixel");
    map = new Map(img, pixel);
}

function animate() {
    logic();
    drawMap();
    window.requestAnimationFrame(animate);
}

function logic() {
    map.moveMouse(mouseX, mouseY);
}

function drawMap() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    map.draw();

    let color = map.getPixelOnMouse();
    let mouseCoordinates = map.getCoordinatesOfScreen(mouseX, mouseY);
    this.debugInformation([
        "r: " + color[0] + " g: " + color[1] + " b: " + color[2] + " a: " + color[3],
        "x: " + Math.round(mouseCoordinates.x) + " y: " + Math.round(mouseCoordinates.y),
        "selected: " + (selectedElement ? selectedElement.id : "")
    ]);
}

function debugInformation(information) {
    context.beginPath();
    context.fillStyle = '#000000';
    context.rect(0, 0, 200, information.length * 10 + 5);
    context.fill();
    context.fillStyle = '#ffffff';
    for (let i = 0; i < information.length; ++i) {
        let info = information[i];
        context.fillText(info, 10, i * 10 + 10);
    }
}

const maxScroll = 3;
const minScroll = 0.5;

class Map {
    constructor(visibleMap, pixelMap) {
        this.visibleMap = visibleMap;

        let pixelCanvas = document.createElement('canvas');
        pixelCanvas.width = visibleMap.width;
        pixelCanvas.height = visibleMap.height;
        this.pixelMap = pixelCanvas.getContext('2d');
        this.pixelMap.drawImage(pixelMap,
            0, 0, visibleMap.width, visibleMap.height,
            0, 0, visibleMap.width, visibleMap.height);

        this.x = 0;
        this.y = 0;
        this.viewPortX = window.innerWidth;
        this.viewPortY = window.innerHeight;
        this.width = this.visibleMap.width;
        this.height = this.visibleMap.height;

        this.towns = [
            new Town(252, 476),
            new Town(876, 396),
            new Town(952, 318),
            new Town(1060, 322),
            new Town(1219, 393),
            new Town(1436, 615),
            new Town(1438, 10857)
        ];
        this.convoys = [
            new Convoy(300, 500)
        ];

        this.scroll = 2.8;
    }

    getSelected(coordinates) {
        for (let key in this.towns) {
            let town = this.towns[key];
            let dis = Math.pow(coordinates.x - town.x, 2) + Math.pow(coordinates.y - town.y, 2);
            if (dis < Math.pow(town.radius, 2)) {
                return town;
            }
        }
        for (let key in this.convoys) {
            let convoy = this.convoys[key];
            let dis = Math.pow(coordinates.x - convoy.x, 2) + Math.pow(coordinates.y - convoy.y, 2);
            if (dis < Math.pow(convoy.radius, 2)) {
                return convoy;
            }
        }
        return null;
    };

    getPixel(x, y) {
        return this.pixelMap.getImageData(x, y, 1, 1).data;
    };

    getPixelOnScreen(x, y) {
        return this.getPixel(this.x + x * this.scroll, this.y + y * this.scroll);
    };

    getPixelOnMouse() {
        return this.getPixelOnScreen(mouseX, mouseY);
    };

    draw() {
        this.drawMap();
        this.drawTowns();
        this.drawConvoys();
    };

    drawConvoys() {
        for (let key in this.convoys) {
            let convoy = this.convoys[key];
            convoy.animate();
        }
    }

    drawTowns() {
        for (let key in this.towns) {
            let town = this.towns[key];
            town.draw();
        }
    }

    drawMap() {
        context.drawImage(this.visibleMap,
            this.x, this.y, this.viewPortX * this.scroll, this.viewPortY * this.scroll,
            0, 0, this.viewPortX, this.viewPortY);

    };

    scrollUpDown(num) {
        this.x += mouseX * this.scroll;
        this.y += mouseY * this.scroll;

        this.scroll += num;
        this.scroll = UtilFunctions.minMax(minScroll, this.scroll, maxScroll);

        this.x -= mouseX * this.scroll;
        this.y -= mouseY * this.scroll;

        try {
            this.x = UtilFunctions.minMax(0, this.x, this.width - this.viewPortX * this.scroll);
            this.y = UtilFunctions.minMax(0, this.y, this.height - this.viewPortY * this.scroll);
        } catch (e) {
            let newSX = this.width / this.viewPortX;
            let newSY = this.height / this.viewPortY;

            this.x += mouseX * this.scroll;
            this.y += mouseY * this.scroll;

            this.scroll = newSX < newSY ? newSX : newSY;

            this.x -= mouseX * this.scroll;
            this.y -= mouseY * this.scroll;

            this.x = UtilFunctions.minMax(0, this.x, this.width - this.viewPortX * this.scroll);
            this.y = UtilFunctions.minMax(0, this.y, this.height - this.viewPortY * this.scroll);
        }
    };

    moveMouse(x, y) {
        if (x < 10) {
            this.move(-1, 0);
        } else if (x > window.innerWidth - 10) {
            this.move(1, 0);
        }
        if (y < 10) {
            this.move(0, -1);
        } else if (y > window.innerHeight - 10) {
            this.move(0, 1);
        }
    };

    move(x, y) {
        if (x < 0) {
            this.x -= 10 * this.scroll;
        } else if (x > 0) {
            this.x += 10 * this.scroll;
        }
        if (y < 0) {
            this.y -= 10 * this.scroll;
        } else if (y > 0) {
            this.y += 10 * this.scroll;
        }

        this.x = UtilFunctions.minMax(0, this.x, this.width - this.viewPortX * this.scroll);
        this.y = UtilFunctions.minMax(0, this.y, this.height - this.viewPortY * this.scroll);
    };

    getCoordinatesOfScreen(x, y) {
        return {
            x: this.x + x * this.scroll,
            y: this.y + y * this.scroll
        };
    };

    getCoordinates(x, y, r = 0) {
        return {
            x: x / this.scroll - this.x / this.scroll,
            y: y / this.scroll - this.y / this.scroll,
            r: r / this.scroll
        };
    }
}

class Element {
    constructor(x, y, fill) {
        this.id = IdManager.getNextId();
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.fill = fill;
    }
}

class Town extends Element {
    constructor(x, y, fill = '#ff4477') {
        super(x, y, fill);
        this.radius = 40;
    }

    draw() {
        context.beginPath();
        let coordinate = map.getCoordinates(this.x, this.y, this.radius);
        context.arc(coordinate.x, coordinate.y, coordinate.r, 0, 2 * Math.PI);
        context.fillStyle = this.fill;
        context.fill();
    };
}

class Convoy extends Element {
    constructor(x, y, fill = '#00ff35') {
        super(x, y, fill);
        this.radius = 25;

        this.destinationX = 1000;
        this.destinationY = 1000;

        this.ships = [new Ship(ShipEnum.FREGATT), new Ship(ShipEnum.BRIGG)];

        this.speed = 0;
        this.recalculateSpeed();
    }


    recalculateSpeed() {
        if (this.ships.length === 0) {
            this.speed = 0;
            return;
        }
        let min = 9999;
        for (let key in this.ships) {
            let ship = this.ships[key].shipEnum;
            if (min > ship.maxSpeed) {
                min = ship.maxSpeed;
            }
        }
        this.speed = min;
    };

    draw() {
        context.beginPath();
        let coordinate = map.getCoordinates(this.x, this.y, this.radius);
        context.arc(coordinate.x, coordinate.y, coordinate.r, 0, 2 * Math.PI);
        context.fillStyle = this.fill;
        context.fill();
    };

    update() {
        let disX = this.destinationX - this.x;
        let disY = this.destinationY - this.y;
        let magnitude = Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2));
        if (magnitude > this.speed) {
            this.x = this.x + (disX / magnitude * this.speed);
            this.y = this.y + (disY / magnitude * this.speed);
        }
    };

    animate() {
        this.update();
        this.draw(this.x, this.y, this.radius, this.fill);
    }
}

class Ship {
    constructor(shipEnum) {
        this.shipEnum = shipEnum;
    }
}

const ShipEnum = {
    PINNACE: {
        name: "PINNACE",
        agility: 100,
        crew: 30,
        health: 25,
        maxSpeed: 10,
        minSpeed: 6,
        guns: 8,
        seals: 1
    },
    BRIGG: {
        name: "BRIGG",
        agility: 95,
        crew: 50,
        health: 40,
        maxSpeed: 10,
        minSpeed: 5,
        guns: 16,
        seals: 2
    },
    FREGATT: {
        name: "FREGATT",
        agility: 80,
        crew: 100,
        health: 75,
        maxSpeed: 11,
        minSpeed: 5,
        guns: 26,
        seals: 3
    }
};

