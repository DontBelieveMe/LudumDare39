var currentMap;
var powerBar: PowerBar;
var ticks: number = 0;
var CHARGES: number=3;
abstract class Entity {
    abstract update();
    eachSecond(){}
    abstract draw(g: CanvasRenderingContext2D);
    keyDown(key: KeyboardEvent){}
    keyUp(key: KeyboardEvent){}
    keyPress(key: KeyboardEvent) {}
}

var BLOCK_SIZE: number = 40;

class Vector {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Tile {
    x: number;
    y: number;
    isSolid: boolean;

    public static createWall(x: number, y: number): Tile {
        let tile: Tile = new Tile();
        tile.x = x;
        tile.y = y;
        tile.isSolid = true;
        return tile;
    }

    public static createEmpty(x: number, y: number): Tile {
        let tile: Tile = new Tile();
        tile.x = x;
        tile.y = y;
        tile.isSolid = false;
        return tile;
    }
}

var LEFT_TO_RIGHT: number = 0;
var RIGHT_TO_LEFT: number = 1;
var TOP_TO_BOTTOM: number = 2;
var BOTTOM_TO_TOP: number = 3;
var dirs: number[] = [
    LEFT_TO_RIGHT,
    RIGHT_TO_LEFT,
    TOP_TO_BOTTOM,
    BOTTOM_TO_TOP
]

var bStates: number[] = [0,1];
function randomBoolean():boolean {
    return bStates[Math.floor(Math.random()*bStates.length)] == 0;    
}

class Conveyor {
    x: number;
    y: number;
    w: number;
    h: number;
    direction: number;
    charges: ElectricCharge[];

    constructor() {
        this.charges = [];
    }
    
    draw(g: CanvasRenderingContext2D) {
    }

    attachCharge(charge: ElectricCharge) {
        console.log("Attaching charge");
        this.charges.push(charge);
    }

    update() {
        this.charges.forEach(element => {
            if(this.direction == TOP_TO_BOTTOM) {
                element.y += 2;
            } else if(this.direction == BOTTOM_TO_TOP) {
                element.y -= 2; 
            } else if(this.direction == LEFT_TO_RIGHT) {
                element.x += 2;
            } else if(this.direction == RIGHT_TO_LEFT) {
                element.x -= 2;
            }
        });
    }

    static createVertical(xIndex: number): Conveyor {
        let conv: Conveyor = new Conveyor();
        conv.x = xIndex * BLOCK_SIZE;
        conv.y = 0;
        conv.w = BLOCK_SIZE;
        conv.h = 600;
        if(randomBoolean()) {
            conv.direction = TOP_TO_BOTTOM;
        } else {
            conv.direction = BOTTOM_TO_TOP;
        }
        return conv;
    }
    
    static createHorizontal(yIndex: number): Conveyor {
        let conv: Conveyor = new Conveyor();
        conv.x = 0;
        conv.y = yIndex * BLOCK_SIZE;
        conv.w = 800;
        conv.h = BLOCK_SIZE;
        if(randomBoolean()) {
            conv.direction = LEFT_TO_RIGHT;
        } else {
            conv.direction = RIGHT_TO_LEFT;
        }
        return conv;
    }
}

class Map {
    charges: ElectricCharge[];
    maze: number[];
    tilesToTry: Vector[];
    currentTile: Vector;
    mapW: number;
    mapH: number;
    wallTiles: Tile[];
    emptyTiles: Tile[];
    conveyors: Conveyor[];
    update() {
        this.conveyors.forEach(element => {
            element.update();
        });
    }
    constructor(mapW: number, mapH: number) {
        this.charges = [];
        this.maze = [];
        this.mapW = mapW;
        this.mapH = mapH;
        this.conveyors = []

        for(let x = 0; x < mapW; x++) {
            for(let y = 0; y < mapH; y++) {
                this.maze[x + y * mapW] = 1;
            }
        }
        
        this.tilesToTry = []
        this.currentTile = new Vector(1, 1);
        this.tilesToTry.push(this.currentTile);
        
        let neighbours: Vector[] = []
        while(this.tilesToTry.length > 0) {
            this.maze[this.currentTile.x + this.currentTile.y * this.mapW] = 0;
            neighbours = this.getValidNeighbours(this.currentTile);
            if(neighbours.length > 0) {
                this.tilesToTry.push(this.currentTile);
                let index: number = Math.floor(Math.random() * neighbours.length);
                this.currentTile = neighbours[index];
            } else {
                this.updateFurthestPoint();
                this.currentTile = this.tilesToTry.pop();
            }
        }
        
        for(let i =0;i<1;i++) {
            let conv: Conveyor;
            if(randomBoolean()) {
                let index: number = Math.floor(Math.random()*this.mapH);
                conv = Conveyor.createHorizontal(index);
                for(let j=0;j<mapW;j++) {
                    this.maze[j + index * mapW] = 2;
                }
            } else {
                let index: number = Math.floor(Math.random()*this.mapW);
                conv = Conveyor.createVertical(index);
                for(let j=0;j<mapH;j++) {
                    this.maze[index + j * mapW] = 2;
                }
            }
            this.conveyors.push(conv);
        }

        this.wallTiles = []
        this.emptyTiles = []
        for(let y = 0; y < this.mapH; y++) {
            for(let x = 0; x < this.mapW; x++) {
                let tileState: number = this.maze[x + y * mapW];
                if(tileState == 1) {
                    this.wallTiles.push(Tile.createWall(x * BLOCK_SIZE, y * BLOCK_SIZE));
                } else if(tileState==0){
                    this.emptyTiles.push(Tile.createEmpty(x * BLOCK_SIZE, y * BLOCK_SIZE));
                }
            }
        }

        let shuffled: Tile[] = this.emptyTiles.sort(function() {return 0.5 - Math.random()});

        for(let i = 0; i < CHARGES; i++) {
            let x = shuffled[i].x;
            let y = shuffled[i].y;
            let charge = new ElectricCharge(x, y);
            this.charges.push(charge);
        }

    }

    updateFurthestPoint() {

    }

    isInsideMaze(tile: Vector): boolean {
        return tile.x >= 0 && tile.y >= 0 && tile.x < this.mapW && tile.y < this.mapH;
    }

    nsew: Vector[] = [new Vector(0, 1), 
                      new Vector(0, -1), 
                      new Vector(1, 0), 
                      new Vector(-1, 0)];
    hasThreeWallsIntact(tile: Vector): boolean {
        let intactWalls: number = 0;
        this.nsew.forEach(dir => {
            let toCheck: Vector = new Vector(tile.x + dir.x, tile.y + dir.y);
            if(this.isInsideMaze(toCheck) && this.maze[toCheck.x + toCheck.y * this.mapW] == 1) {
                intactWalls = intactWalls + 1;
            }
        });
        return intactWalls == 3;
    }

    getValidNeighbours(tile: Vector): Vector[] {
        let neighbours: Vector[] = []
        this.nsew.forEach(dir => {
            let toCheck: Vector = new Vector(tile.x + dir.x, tile.y + dir.y);
            if(toCheck.x % 2 == 1 || toCheck.y % 2 == 1) {
                if(this.maze[toCheck.x + toCheck.y * this.mapW] == 1 && this.hasThreeWallsIntact(toCheck)) {
                    neighbours.push(toCheck);
                }
            }
        });
        return neighbours;
    }

    draw(g: CanvasRenderingContext2D) {
        g.fillStyle="#000000";
        for(let y = 0; y < this.mapH*BLOCK_SIZE;y+=BLOCK_SIZE) {
            for(let x = 0; x < this.mapW*BLOCK_SIZE;x+=BLOCK_SIZE) {
                let iy: number = y / BLOCK_SIZE;
                let ix: number = x / BLOCK_SIZE;
                if(this.maze[ix + iy * this.mapW] ==1) {
                    g.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
        g.fillStyle="#dbd4ba";
        this.conveyors.forEach(element => {
            g.fillRect(element.x, element.y, element.w,element.h);
        });
        this.charges.forEach(charge => {
            charge.draw(g);
        });
    }
}
var round: number=1;
class ElectricCharge extends Entity {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }

    update() {

    }

    draw(g: CanvasRenderingContext2D) {
        g.fillStyle = "#d8ce45";
        g.fillRect(this.x, this.y, BLOCK_SIZE/2, BLOCK_SIZE/2);
    }
}

var hardness_count:number = 1;
var tickDown:boolean = true;
class PowerBar extends Entity {
    fullness: number = 100;

    draw(g: CanvasRenderingContext2D) {
        g.fillStyle="#d8ce45";
        let height: number = this.fullness * 6;
        g.fillRect(800, 0, 50, height);
    }

    update() {
        if(!tickDown)return;
        if(ticks % 60 == 0) {
            this.fullness -= hardness_count;
        }
    }

    eachSecond() {
    }
}

class Player extends Entity {
    x : number;
    y : number;
    vx : number;
    vy : number;
    speed: number;
    w: number = 15;
    h: number = 15;

    constructor() {
        super();

        this.x = currentMap.emptyTiles[0].x+3;
        this.y = currentMap.emptyTiles[0].y+3;
        
        this.speed = 5;
        this.vx = 0;
        this.vy = 0;
    }

    update() {
        if(this.holdingCharge != undefined) {
            this.holdingCharge.x = this.x + 10;
            this.holdingCharge.y = this.y + 10;
        }

        let walls: Tile[] = currentMap.wallTiles;
        walls.forEach(wall => {
             if(this.x + this.vx + this.w > wall.x && this.x+this.vx < wall.x + BLOCK_SIZE) {
                if(this.y + this.vy + this.h > wall.y && this.y+this.vy < wall.y + BLOCK_SIZE) {
                    if(this.x + this.vx + this.w > wall.x && this.vx>0 || this.x+this.vx < wall.x + BLOCK_SIZE&&this.vx<0) {
                        this.vx=0;                        
                    }
                    if(this.y + this.vy + this.h > wall.y&&this.vy>0 || this.y + this.vy < wall.y + BLOCK_SIZE&&this.vy<0){
                        this.vy=0;
                    }
                    
                }
             }
        });

        this.x += this.vx;
        this.y += this.vy;
    }
    prevKey = 0;

    keyDown(key: KeyboardEvent) {
        if(key.keyCode == 65) {
            this.vx = -this.speed;
        } else if(key.keyCode == 68) {
            this.vx = this.speed;
        }
         if(key.keyCode == 87) {
            this.vy = -this.speed;
        } else if(key.keyCode == 83) {
            this.vy = this.speed;
        }
        this.prevKey=key.keyCode;
    }

    keyUp(key :KeyboardEvent) {
        this.vx = 0;
        this.vy = 0;
    }

    holdingCharge: ElectricCharge;
    keyPress(key: KeyboardEvent) {
        let code: number = key.keyCode;
        if(code == 65 || code==68||code==87||code==83)return;
        if(code==32){
            if(this.holdingCharge) {
                currentMap.conveyors.forEach(element => {
                    if(this.x < element.x + element.w && 
                        this.x + this.w > element.x) {
                        if(this.y < element.y + element.h && 
                            this.y + this.h > element.y) {
                            element.attachCharge(this.holdingCharge);
                        }
                    }
                });
                this.holdingCharge=undefined;
                return;
            }
        let map: Map = currentMap;
        map.charges.forEach(charge => {
            if(this.x < charge.x + BLOCK_SIZE &&
               this.x + 32 > charge.x &&
                this.y < charge.y + BLOCK_SIZE &&
                this.y + 64 > charge.y) {
                    this.holdingCharge = charge;
                }
        });
        }
    }

    draw(g: CanvasRenderingContext2D) {
        g.fillStyle = "#FF00FF";
        g.fillRect(this.x,this.y, this.w, this.h);
    }

    eachSecond() {
    }
}

class Game {
    fps: number;
    tickCounter: number;
    entitys: Entity[];
    graphics: CanvasRenderingContext2D;
    map: Map;

    constructor(g: CanvasRenderingContext2D) {
        this.fps = 60;
        this.tickCounter = 0;
        this.entitys = [];
        this.map = new Map(800/BLOCK_SIZE, 600/BLOCK_SIZE);
        currentMap = this.map;
        powerBar = new PowerBar();
        this.entitys.push(new Player());
        this.graphics = g;
    }

    public start() {

    }

    public keyDown(key: KeyboardEvent) {
        this.entitys.forEach(entity => {
           entity.keyDown(key); 
        });
    }

    
    public keyUp(key: KeyboardEvent) {
        this.entitys.forEach(entity => {
           entity.keyUp(key); 
        });
    }

    public draw(g:CanvasRenderingContext2D) {
        g.clearRect(0, 0, 850, 600);
        if(!this.end_game) {
            this.map.draw(g);
            this.entitys.forEach(entity => {
                entity.draw(g);
            });
            powerBar.draw(g);
        } else {
            let wt: number = g.measureText("End game! Refresh to restart!").width;
            g.strokeText("End game! Refresh to restart!", (800/2)-wt/2, 600/2);
        }
    }

    public eachSecond() {
        this.entitys.forEach(entity => {
            entity.eachSecond();
        });
    }

    public keyPress(key: KeyboardEvent) {
        this.entitys.forEach(element => {
            element.keyPress(key);
        });
    }
    end_game: boolean=false;
    public update() {
        if(this.end_game) return;
        this.entitys.forEach(entity => {
            entity.update();
        });
        powerBar.update();
        currentMap.update();
        if(powerBar.fullness <= 0) {
            this.end_game=true;
        }
        currentMap.conveyors.forEach(element => {
            if(element.charges.length==CHARGES) {
                BLOCK_SIZE-=2;
                this.entitys = []
                this.map = new Map(800/BLOCK_SIZE, 600/BLOCK_SIZE);
                currentMap = this.map;
                powerBar = new PowerBar();
                this.entitys.push(new Player());
                round = round + 1;
                document.getElementById("round").textContent="Round " + round;  
                if(hardness_count>1)
                    hardness_count-=1;
            }
        });
    }

    public loop() {
        this.update();
        this.draw(this.graphics);
    }
}

window.onload = function() {
    var canvas = <HTMLCanvasElement>document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var game: Game = new Game(context);
    
    var loops = 0, skipTicks = 1000 / game.fps;
    var maxSkip = 10, nextTick = (new Date).getTime();
    var run = function() {
        loops = 0;
        while((new Date).getTime() > nextTick && loops < maxSkip) {
            ticks++;
            if(ticks > 2700) ticks = 0;
            game.update();
            nextTick += skipTicks;
            loops++;
        }
        game.draw(context);
    };

    game.start();
    addEventListener("keydown", (key: KeyboardEvent) => game.keyDown(key));
    addEventListener("keyup", (key:KeyboardEvent) => game.keyUp(key));
    addEventListener("keypress", (key: KeyboardEvent) => game.keyPress(key));
    setInterval(run, 1000 / game.fps);
}