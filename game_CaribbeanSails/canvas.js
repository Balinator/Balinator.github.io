document.oncontextmenu = function () {
    return false;
};

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

class GameLoop {
    static canvas;
    static context;
    static map;

    static mouseX;
    static mouseY;

    static selectedElement = null;

    static panels;

    static lengthCalculator;

    static onResize() {
        GameLoop.canvas = document.getElementById("canvas");
        GameLoop.canvas.width = window.innerWidth;
        GameLoop.canvas.height = window.innerHeight;
        GameLoop.context = GameLoop.canvas.getContext("2d");
    }

    static main() {
        GameLoop.onResize();
        GameLoop.initialize();
        GameLoop.animate();
    }

    static initialize() {
        let img = document.getElementById("background");
        let pixel = document.getElementById("background-pixel");
        GameLoop.lengthCalculator = document.getElementById('length-calculator');
        GameLoop.map = new Map(img, pixel);
        GameLoop.panels = [
            new InfoPanel(10, window.innerHeight - 160, 300, 150,
                ['SomethingSomethingSomethingSomething', 'NothingNothingNothing'],
                15, 'Arial'
            ),
            new ButtonPanel(10, 100, 100, 40, 'Click here!', function () {
                console.log('Clicked!');
            })
        ];
        GameLoop.panels[1].open = true;
    }

    static animate() {
        GameLoop.logic();
        GameLoop.draw();
        window.requestAnimationFrame(GameLoop.animate);
    }

    static logic() {
        GameLoop.map.moveMouse(GameLoop.mouseX, GameLoop.mouseY);
    }

    static draw() {
        GameLoop.context.clearRect(0, 0, canvas.width, canvas.height);
        GameLoop.drawMap();
        GameLoop.drawPanels();
    }

    static drawPanels() {
        let filteredPanels = GameLoop.panels.filter(p => p.open);
        for (let key in filteredPanels) {
            let panel = filteredPanels[key];
            panel.draw();
        }
    }

    static drawMap() {
        GameLoop.map.draw();

        let color = GameLoop.map.getPixelOfMouse();
        let mouseCoordinates = GameLoop.map.getCoordinatesOnScreen(GameLoop.mouseX, GameLoop.mouseY);
        GameLoop.debugInformation([
            "r: " + color[0] + " g: " + color[1] + " b: " + color[2] + " a: " + color[3],
            "x: " + Math.round(mouseCoordinates.x) + " y: " + Math.round(mouseCoordinates.y),
            "selected: " + (GameLoop.selectedElement ? GameLoop.selectedElement.id : "")
        ]);
    }

    static debugInformation(information) {
        GameLoop.context.beginPath();
        GameLoop.context.fillStyle = '#000000';
        GameLoop.context.rect(0, 0, 200, information.length * 10 + 10);
        GameLoop.context.fill();
        GameLoop.context.fillStyle = '#ffffff';
        GameLoop.context.font = '10px Arial';
        GameLoop.context.textAlign = 'start';
        for (let i = 0; i < information.length; ++i) {
            let info = information[i];
            GameLoop.context.fillText(info, 10, i * 10 + 15);
        }
    }
}

class GameHandlerEvents {
    static onScroll(event) {
        GameLoop.map.scrollUpDown(event.deltaY / 1000.0);
    }

    static onMouseMove(event) {
        GameLoop.mouseX = event.x;
        GameLoop.mouseY = event.y;
    }

    static onMouseClick(event) {
        if(this.onUiClick(event)){return;}
        this.onMapClick(event);
    }

    static onUiClick(event) {
        let coordinates = {x: event.x, y: event.y};
        let filteredPanels = GameLoop.panels.filter(p => p instanceof ClickablePanel);
        for(let key in filteredPanels) {
            let panel = filteredPanels[key];
            if(panel.isClickedOn(coordinates)){
                panel.click(event);
                return true;
            }
        }
        return false;
    }

    static onMapClick(event) {
        let coordinates = GameLoop.map.getCoordinatesOnScreen(event.x, event.y);

        switch (event.button) {
            case 0:
                GameLoop.selectedElement = GameLoop.map.getSelected(coordinates);
                GameLoop.panels[0].open = false;
                if (GameLoop.selectedElement instanceof Town) {
                    GameLoop.selectedElement.setUpPanel();
                }
                return true;
            case 2:
                if (GameLoop.selectedElement instanceof Convoy) {
                    let selectedTown = GameLoop.map.getSelectedTown(coordinates);
                    if (selectedTown !== null) {
                        GameLoop.selectedElement.goToTown(selectedTown);
                    } else {
                        GameLoop.selectedElement.goTo(coordinates);
                    }
                }
                return true;
        }
        return false;
    }

    static onKeyDown(event) {
        console.log(event.key);
        switch (event.key) {
            case 'W':
            case 'w':
            case 'ArrowUp':
                GameLoop.map.move(0, -1);
                break;
            case 'S':
            case 's':
            case 'ArrowDown':
                GameLoop.map.move(0, 1);
                break;
            case 'A':
            case 'a':
            case 'ArrowLeft':
                GameLoop.map.move(-1, 0);
                break;
            case 'D':
            case 'd':
            case 'ArrowRight':
                GameLoop.map.move(1, 0);
                break;
            case 'Q':
            case 'q':
            case '+':
                GameLoop.map.scrollUpDown(-0.1);
                break;
            case 'E':
            case 'e':
            case '-':
                GameLoop.map.scrollUpDown(0.1);
                break;
        }
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
            new Town(252, 476, 'Corpus Cristi'),
            new Town(876, 396),
            new Town(952, 318),
            new Town(1060, 322),
            new Town(1219, 393),
            new Town(1436, 615),
            new Town(1438, 1085, 'Havana')
        ];
        this.convoys = [
            new Convoy(300, 500, 'You')
        ];

        this.scroll = 2.8;
    }

    getSelected(coordinates) {
        let selected = this.getSelectedConvoy(coordinates);
        if (selected !== null) {
            return selected
        }
        return this.getSelectedTown(coordinates);
    }

    getSelectedConvoy(coordinates) {
        for (let key in this.convoys) {
            let convoy = this.convoys[key];
            let dis = Math.pow(coordinates.x - convoy.x, 2) + Math.pow(coordinates.y - convoy.y, 2);
            if (dis < Math.pow(convoy.radius, 2)) {
                return convoy;
            }
        }
        return null;
    }

    getSelectedTown(coordinates) {
        for (let key in this.towns) {
            let town = this.towns[key];
            let dis = Math.pow(coordinates.x - town.x, 2) + Math.pow(coordinates.y - town.y, 2);
            if (dis < Math.pow(town.radius, 2)) {
                return town;
            }
        }
        return null;
    }

    getPixel(x, y) {
        return this.pixelMap.getImageData(x, y, 1, 1).data;
    }

    getPixelOnScreen(x, y) {
        return this.getPixel(this.x + x * this.scroll, this.y + y * this.scroll);
    }

    getPixelOfMouse() {
        return this.getPixelOnScreen(GameLoop.mouseX, GameLoop.mouseY);
    }

    draw() {
        this.drawMap();
        this.drawTowns();
        this.drawConvoys();
    }

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
        GameLoop.context.drawImage(this.visibleMap,
            this.x, this.y, this.viewPortX * this.scroll, this.viewPortY * this.scroll,
            0, 0, this.viewPortX, this.viewPortY);
    }

    scrollUpDown(num) {
        this.x += GameLoop.mouseX * this.scroll;
        this.y += GameLoop.mouseY * this.scroll;

        this.scroll += num;
        this.scroll = UtilFunctions.minMax(minScroll, this.scroll, maxScroll);

        this.x -= GameLoop.mouseX * this.scroll;
        this.y -= GameLoop.mouseY * this.scroll;

        try {
            this.x = UtilFunctions.minMax(0, this.x, this.width - this.viewPortX * this.scroll);
            this.y = UtilFunctions.minMax(0, this.y, this.height - this.viewPortY * this.scroll);
        } catch (e) {
            let newSX = this.width / this.viewPortX;
            let newSY = this.height / this.viewPortY;

            this.x += GameLoop.mouseX * this.scroll;
            this.y += GameLoop.mouseY * this.scroll;

            this.scroll = newSX < newSY ? newSX : newSY;

            this.x -= GameLoop.mouseX * this.scroll;
            this.y -= GameLoop.mouseY * this.scroll;

            this.x = UtilFunctions.minMax(0, this.x, this.width - this.viewPortX * this.scroll);
            this.y = UtilFunctions.minMax(0, this.y, this.height - this.viewPortY * this.scroll);
        }
    }

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
    }

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
    }

    getCoordinatesOnScreen(x, y) {
        return {
            x: this.x + x * this.scroll,
            y: this.y + y * this.scroll
        };
    }

    getCoordinates(x, y, r = 0) {
        return {
            x: x / this.scroll - this.x / this.scroll,
            y: y / this.scroll - this.y / this.scroll,
            r: r / this.scroll
        };
    }
}

class Panel {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.fill = '#755000';
        this.open = false;
    }

    draw() {
        GameLoop.context.beginPath();
        GameLoop.context.fillStyle = this.fill;
        GameLoop.context.rect(this.x, this.y, this.width, this.height);
        GameLoop.context.fill();
    }
}

class InfoPanel extends Panel {
    constructor(x, y, width, height, texts, fontSize = 10, fontFamily = 'Arial') {
        super(x, y, width, height);
        this.texts = texts;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
    }

    draw() {
        super.draw();
        GameLoop.context.fillStyle = '#ffffff';
        let startY = this.y + (this.height - this.texts.length * this.fontSize) / 2.0 + this.fontSize;
        for (let i = 0; i < this.texts.length; ++i) {
            let info = this.texts[i];
            let startX = this.x + this.width / 2.0;
            GameLoop.context.textAlign = 'center';
            GameLoop.context.font = this.fontSize + 'px ' + this.fontFamily;
            GameLoop.context.fillText(info, startX, startY + i * this.fontSize, this.width);
        }
    }
}

class ClickablePanel extends Panel{
    constructor(x, y, width, height, onClick){
        super(x, y, width, height);
        this.onClick = onClick;
    }

    click(event) {
        this.onClick(event);
    }

    isClickedOn(coordinates) {
        return coordinates.x > this.x
            && coordinates.x < this.x + this.width
            && coordinates.y > this.y
            && coordinates.y < this.y + this.height;

    }
}

class ButtonPanel extends ClickablePanel {
    constructor(x, y, width, height, text, onClick, fontSize = 10, fontFamily = 'Arial') {
        super(x, y, width, height, onClick);
        this.text = text;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
    }

    draw() {
        super.draw();
        GameLoop.context.fillStyle = '#ffffff';
        let startY = this.y + (this.height - this.fontSize) / 2.0;
        let info = this.text;
        let startX = this.x + this.width / 2.0;
        GameLoop.context.textAlign = 'center';
        GameLoop.context.font = this.fontSize + 'px ' + this.fontFamily;
        GameLoop.context.fillText(info, startX, startY + this.fontSize, this.width);
    }
}

class Element {
    constructor(x, y, fill, name) {
        this.id = IdManager.getNextId();
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.fill = fill;
        this.name = name;
    }
}

class Town extends Element {
    constructor(x, y, name = 'none', fill = '#ff4477') {
        super(x, y, fill, name);
        this.radius = 40;
        this.convoys = [];
    }

    setUpPanel () {
        GameLoop.panels[0].open = true;
        let convoys = '';
        GameLoop.selectedElement.convoys.forEach(c => convoys += c.name + ", ");
        GameLoop.panels[0].texts = [
            'Name: ' + GameLoop.selectedElement.name,
            'Convoys: ' + convoys.substring(0, convoys.length - 2)
        ];
    }

    addConvoy(convoy) {
        this.convoys.push(convoy);
        if(GameLoop.selectedElement === this) {
            this.setUpPanel();
        }
    }

    hasConvoy(convoy) {
        return this.convoys.indexOf(convoy) !== -1;
    }

    removeConvoy(convoy) {
        this.convoys.splice(this.convoys.indexOf(convoy), 1);
        if(GameLoop.selectedElement === this) {
            this.setUpPanel();
        }
    }

    draw() {
        GameLoop.context.beginPath();
        let coordinate = GameLoop.map.getCoordinates(this.x, this.y, this.radius);
        GameLoop.context.arc(coordinate.x, coordinate.y, coordinate.r, 0, 2 * Math.PI);
        GameLoop.context.fillStyle = this.fill;
        GameLoop.context.fill();
    }
}

class Convoy extends Element {
    constructor(x, y, name = 'none', fill = '#00ff35') {
        super(x, y, fill, name);
        this.radius = 25;

        this.destinationTown = null;
        this.destinationTownReached = false;
        this.destinationX = 1000;
        this.destinationY = 1000;

        this.ships = [new Ship(ShipEnum.FREGATT), new Ship(ShipEnum.BRIGG)];

        this.speed = 0;
        this.recalculateSpeed();
    }

    goToTown(town) {
        this.goTo({x: town.x, y: town.y});
        this.destinationTown = town;
    }

    goTo(coordinates) {
        if (this.destinationTownReached) {
            this.destinationTown.removeConvoy(this);
        }
        this.destinationTown = null;
        this.destinationTownReached = false;
        this.destinationX = coordinates.x;
        this.destinationY = coordinates.y;
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
    }

    animate() {
        this.update();
        this.draw(this.x, this.y, this.radius, this.fill);
    }

    draw() {
        if (this.destinationTownReached === false) {
            GameLoop.context.beginPath();
            let coordinate = GameLoop.map.getCoordinates(this.x, this.y, this.radius);
            GameLoop.context.arc(coordinate.x, coordinate.y, coordinate.r, 0, 2 * Math.PI);
            GameLoop.context.fillStyle = this.fill;
            GameLoop.context.fill();
        }
    }

    update() {
        let disX = this.destinationX - this.x;
        let disY = this.destinationY - this.y;
        let magnitude = Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2));
        if (magnitude > this.speed) {
            this.x += disX / magnitude * this.speed;
            this.y += disY / magnitude * this.speed;
        } else {
            this.x += disX;
            this.y += disY;
            if (this.destinationTown !== null && !this.destinationTown.hasConvoy(this)) {
                this.destinationTownReached = true;
                this.destinationTown.addConvoy(this);
            }
        }
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

