var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var currentMap;
var powerBar;
var ticks = 0;
var CHARGES = 3;
var Entity = (function () {
    function Entity() {
    }
    Entity.prototype.eachSecond = function () { };
    Entity.prototype.keyDown = function (key) { };
    Entity.prototype.keyUp = function (key) { };
    Entity.prototype.keyPress = function (key) { };
    return Entity;
}());
var BLOCK_SIZE = 40;
var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    return Vector;
}());
var Tile = (function () {
    function Tile() {
    }
    Tile.createWall = function (x, y) {
        var tile = new Tile();
        tile.x = x;
        tile.y = y;
        tile.isSolid = true;
        return tile;
    };
    Tile.createEmpty = function (x, y) {
        var tile = new Tile();
        tile.x = x;
        tile.y = y;
        tile.isSolid = false;
        return tile;
    };
    return Tile;
}());
var LEFT_TO_RIGHT = 0;
var RIGHT_TO_LEFT = 1;
var TOP_TO_BOTTOM = 2;
var BOTTOM_TO_TOP = 3;
var dirs = [
    LEFT_TO_RIGHT,
    RIGHT_TO_LEFT,
    TOP_TO_BOTTOM,
    BOTTOM_TO_TOP
];
var bStates = [0, 1];
function randomBoolean() {
    return bStates[Math.floor(Math.random() * bStates.length)] == 0;
}
var Conveyor = (function () {
    function Conveyor() {
        this.charges = [];
    }
    Conveyor.prototype.draw = function (g) {
    };
    Conveyor.prototype.attachCharge = function (charge) {
        console.log("Attaching charge");
        this.charges.push(charge);
    };
    Conveyor.prototype.update = function () {
        var _this = this;
        this.charges.forEach(function (element) {
            if (_this.direction == TOP_TO_BOTTOM) {
                element.y += 2;
            }
            else if (_this.direction == BOTTOM_TO_TOP) {
                element.y -= 2;
            }
            else if (_this.direction == LEFT_TO_RIGHT) {
                element.x += 2;
            }
            else if (_this.direction == RIGHT_TO_LEFT) {
                element.x -= 2;
            }
        });
    };
    Conveyor.createVertical = function (xIndex) {
        var conv = new Conveyor();
        conv.x = xIndex * BLOCK_SIZE;
        conv.y = 0;
        conv.w = BLOCK_SIZE;
        conv.h = 600;
        if (randomBoolean()) {
            conv.direction = TOP_TO_BOTTOM;
        }
        else {
            conv.direction = BOTTOM_TO_TOP;
        }
        return conv;
    };
    Conveyor.createHorizontal = function (yIndex) {
        var conv = new Conveyor();
        conv.x = 0;
        conv.y = yIndex * BLOCK_SIZE;
        conv.w = 800;
        conv.h = BLOCK_SIZE;
        if (randomBoolean()) {
            conv.direction = LEFT_TO_RIGHT;
        }
        else {
            conv.direction = RIGHT_TO_LEFT;
        }
        return conv;
    };
    return Conveyor;
}());
var Map = (function () {
    function Map(mapW, mapH) {
        this.nsew = [new Vector(0, 1),
            new Vector(0, -1),
            new Vector(1, 0),
            new Vector(-1, 0)];
        this.charges = [];
        this.maze = [];
        this.mapW = mapW;
        this.mapH = mapH;
        this.conveyors = [];
        for (var x = 0; x < mapW; x++) {
            for (var y = 0; y < mapH; y++) {
                this.maze[x + y * mapW] = 1;
            }
        }
        this.tilesToTry = [];
        this.currentTile = new Vector(1, 1);
        this.tilesToTry.push(this.currentTile);
        var neighbours = [];
        while (this.tilesToTry.length > 0) {
            this.maze[this.currentTile.x + this.currentTile.y * this.mapW] = 0;
            neighbours = this.getValidNeighbours(this.currentTile);
            if (neighbours.length > 0) {
                this.tilesToTry.push(this.currentTile);
                var index = Math.floor(Math.random() * neighbours.length);
                this.currentTile = neighbours[index];
            }
            else {
                this.updateFurthestPoint();
                this.currentTile = this.tilesToTry.pop();
            }
        }
        for (var i = 0; i < 1; i++) {
            var conv = void 0;
            if (randomBoolean()) {
                var index = Math.floor(Math.random() * this.mapH);
                conv = Conveyor.createHorizontal(index);
                for (var j = 0; j < mapW; j++) {
                    this.maze[j + index * mapW] = 2;
                }
            }
            else {
                var index = Math.floor(Math.random() * this.mapW);
                conv = Conveyor.createVertical(index);
                for (var j = 0; j < mapH; j++) {
                    this.maze[index + j * mapW] = 2;
                }
            }
            this.conveyors.push(conv);
        }
        this.wallTiles = [];
        this.emptyTiles = [];
        for (var y = 0; y < this.mapH; y++) {
            for (var x = 0; x < this.mapW; x++) {
                var tileState = this.maze[x + y * mapW];
                if (tileState == 1) {
                    this.wallTiles.push(Tile.createWall(x * BLOCK_SIZE, y * BLOCK_SIZE));
                }
                else if (tileState == 0) {
                    this.emptyTiles.push(Tile.createEmpty(x * BLOCK_SIZE, y * BLOCK_SIZE));
                }
            }
        }
        var shuffled = this.emptyTiles.sort(function () { return 0.5 - Math.random(); });
        for (var i = 0; i < CHARGES; i++) {
            var x = shuffled[i].x;
            var y = shuffled[i].y;
            var charge = new ElectricCharge(x, y);
            this.charges.push(charge);
        }
    }
    Map.prototype.update = function () {
        this.conveyors.forEach(function (element) {
            element.update();
        });
    };
    Map.prototype.updateFurthestPoint = function () {
    };
    Map.prototype.isInsideMaze = function (tile) {
        return tile.x >= 0 && tile.y >= 0 && tile.x < this.mapW && tile.y < this.mapH;
    };
    Map.prototype.hasThreeWallsIntact = function (tile) {
        var _this = this;
        var intactWalls = 0;
        this.nsew.forEach(function (dir) {
            var toCheck = new Vector(tile.x + dir.x, tile.y + dir.y);
            if (_this.isInsideMaze(toCheck) && _this.maze[toCheck.x + toCheck.y * _this.mapW] == 1) {
                intactWalls = intactWalls + 1;
            }
        });
        return intactWalls == 3;
    };
    Map.prototype.getValidNeighbours = function (tile) {
        var _this = this;
        var neighbours = [];
        this.nsew.forEach(function (dir) {
            var toCheck = new Vector(tile.x + dir.x, tile.y + dir.y);
            if (toCheck.x % 2 == 1 || toCheck.y % 2 == 1) {
                if (_this.maze[toCheck.x + toCheck.y * _this.mapW] == 1 && _this.hasThreeWallsIntact(toCheck)) {
                    neighbours.push(toCheck);
                }
            }
        });
        return neighbours;
    };
    Map.prototype.draw = function (g) {
        g.fillStyle = "#000000";
        for (var y = 0; y < this.mapH * BLOCK_SIZE; y += BLOCK_SIZE) {
            for (var x = 0; x < this.mapW * BLOCK_SIZE; x += BLOCK_SIZE) {
                var iy = y / BLOCK_SIZE;
                var ix = x / BLOCK_SIZE;
                if (this.maze[ix + iy * this.mapW] == 1) {
                    g.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
        g.fillStyle = "#dbd4ba";
        this.conveyors.forEach(function (element) {
            g.fillRect(element.x, element.y, element.w, element.h);
        });
        this.charges.forEach(function (charge) {
            charge.draw(g);
        });
    };
    return Map;
}());
var round = 1;
var ElectricCharge = (function (_super) {
    __extends(ElectricCharge, _super);
    function ElectricCharge(x, y) {
        var _this = _super.call(this) || this;
        _this.x = x;
        _this.y = y;
        return _this;
    }
    ElectricCharge.prototype.update = function () {
    };
    ElectricCharge.prototype.draw = function (g) {
        g.fillStyle = "#d8ce45";
        g.fillRect(this.x, this.y, BLOCK_SIZE / 2, BLOCK_SIZE / 2);
    };
    return ElectricCharge;
}(Entity));
var hardness_count = 1;
var tickDown = true;
var PowerBar = (function (_super) {
    __extends(PowerBar, _super);
    function PowerBar() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.fullness = 100;
        return _this;
    }
    PowerBar.prototype.draw = function (g) {
        g.fillStyle = "#d8ce45";
        var height = this.fullness * 6;
        g.fillRect(800, 0, 50, height);
    };
    PowerBar.prototype.update = function () {
        if (!tickDown)
            return;
        if (ticks % 60 == 0) {
            this.fullness -= hardness_count;
        }
    };
    PowerBar.prototype.eachSecond = function () {
    };
    return PowerBar;
}(Entity));
var Player = (function (_super) {
    __extends(Player, _super);
    function Player() {
        var _this = _super.call(this) || this;
        _this.w = 15;
        _this.h = 15;
        _this.prevKey = 0;
        _this.x = currentMap.emptyTiles[0].x + 3;
        _this.y = currentMap.emptyTiles[0].y + 3;
        _this.speed = 5;
        _this.vx = 0;
        _this.vy = 0;
        return _this;
    }
    Player.prototype.update = function () {
        var _this = this;
        if (this.holdingCharge != undefined) {
            this.holdingCharge.x = this.x + 10;
            this.holdingCharge.y = this.y + 10;
        }
        var walls = currentMap.wallTiles;
        walls.forEach(function (wall) {
            if (_this.x + _this.vx + _this.w > wall.x && _this.x + _this.vx < wall.x + BLOCK_SIZE) {
                if (_this.y + _this.vy + _this.h > wall.y && _this.y + _this.vy < wall.y + BLOCK_SIZE) {
                    if (_this.x + _this.vx + _this.w > wall.x && _this.vx > 0 || _this.x + _this.vx < wall.x + BLOCK_SIZE && _this.vx < 0) {
                        _this.vx = 0;
                    }
                    if (_this.y + _this.vy + _this.h > wall.y && _this.vy > 0 || _this.y + _this.vy < wall.y + BLOCK_SIZE && _this.vy < 0) {
                        _this.vy = 0;
                    }
                }
            }
        });
        this.x += this.vx;
        this.y += this.vy;
    };
    Player.prototype.keyDown = function (key) {
        if (key.keyCode == 65) {
            this.vx = -this.speed;
        }
        else if (key.keyCode == 68) {
            this.vx = this.speed;
        }
        if (key.keyCode == 87) {
            this.vy = -this.speed;
        }
        else if (key.keyCode == 83) {
            this.vy = this.speed;
        }
        this.prevKey = key.keyCode;
    };
    Player.prototype.keyUp = function (key) {
        this.vx = 0;
        this.vy = 0;
    };
    Player.prototype.keyPress = function (key) {
        var _this = this;
        var code = key.keyCode;
        if (code == 65 || code == 68 || code == 87 || code == 83)
            return;
        if (code == 32) {
            if (this.holdingCharge) {
                currentMap.conveyors.forEach(function (element) {
                    if (_this.x < element.x + element.w &&
                        _this.x + _this.w > element.x) {
                        if (_this.y < element.y + element.h &&
                            _this.y + _this.h > element.y) {
                            element.attachCharge(_this.holdingCharge);
                        }
                    }
                });
                this.holdingCharge = undefined;
                return;
            }
            var map = currentMap;
            map.charges.forEach(function (charge) {
                if (_this.x < charge.x + BLOCK_SIZE &&
                    _this.x + 32 > charge.x &&
                    _this.y < charge.y + BLOCK_SIZE &&
                    _this.y + 64 > charge.y) {
                    _this.holdingCharge = charge;
                }
            });
        }
    };
    Player.prototype.draw = function (g) {
        g.fillStyle = "#FF00FF";
        g.fillRect(this.x, this.y, this.w, this.h);
    };
    Player.prototype.eachSecond = function () {
    };
    return Player;
}(Entity));
var Game = (function () {
    function Game(g) {
        this.end_game = false;
        this.fps = 60;
        this.tickCounter = 0;
        this.entitys = [];
        this.map = new Map(800 / BLOCK_SIZE, 600 / BLOCK_SIZE);
        currentMap = this.map;
        powerBar = new PowerBar();
        this.entitys.push(new Player());
        this.graphics = g;
    }
    Game.prototype.start = function () {
    };
    Game.prototype.keyDown = function (key) {
        this.entitys.forEach(function (entity) {
            entity.keyDown(key);
        });
    };
    Game.prototype.keyUp = function (key) {
        this.entitys.forEach(function (entity) {
            entity.keyUp(key);
        });
    };
    Game.prototype.draw = function (g) {
        g.clearRect(0, 0, 850, 600);
        if (!this.end_game) {
            this.map.draw(g);
            this.entitys.forEach(function (entity) {
                entity.draw(g);
            });
            powerBar.draw(g);
        }
        else {
            var wt = g.measureText("End game! Refresh to restart!").width;
            g.strokeText("End game! Refresh to restart!", (800 / 2) - wt / 2, 600 / 2);
        }
    };
    Game.prototype.eachSecond = function () {
        this.entitys.forEach(function (entity) {
            entity.eachSecond();
        });
    };
    Game.prototype.keyPress = function (key) {
        this.entitys.forEach(function (element) {
            element.keyPress(key);
        });
    };
    Game.prototype.update = function () {
        var _this = this;
        if (this.end_game)
            return;
        this.entitys.forEach(function (entity) {
            entity.update();
        });
        powerBar.update();
        currentMap.update();
        if (powerBar.fullness <= 0) {
            this.end_game = true;
        }
        currentMap.conveyors.forEach(function (element) {
            if (element.charges.length == CHARGES) {
                BLOCK_SIZE -= 2;
                _this.entitys = [];
                _this.map = new Map(800 / BLOCK_SIZE, 600 / BLOCK_SIZE);
                currentMap = _this.map;
                powerBar = new PowerBar();
                _this.entitys.push(new Player());
                round = round + 1;
                document.getElementById("round").textContent = "Round " + round;
                if (hardness_count > 1)
                    hardness_count -= 1;
            }
        });
    };
    Game.prototype.loop = function () {
        this.update();
        this.draw(this.graphics);
    };
    return Game;
}());
window.onload = function () {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var game = new Game(context);
    var loops = 0, skipTicks = 1000 / game.fps;
    var maxSkip = 10, nextTick = (new Date).getTime();
    var run = function () {
        loops = 0;
        while ((new Date).getTime() > nextTick && loops < maxSkip) {
            ticks++;
            if (ticks > 2700)
                ticks = 0;
            game.update();
            nextTick += skipTicks;
            loops++;
        }
        game.draw(context);
    };
    game.start();
    addEventListener("keydown", function (key) { return game.keyDown(key); });
    addEventListener("keyup", function (key) { return game.keyUp(key); });
    addEventListener("keypress", function (key) { return game.keyPress(key); });
    setInterval(run, 1000 / game.fps);
};
//# sourceMappingURL=app.js.map