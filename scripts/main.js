var canvas = document.getElementById("canvas");
var draw = canvas.getContext("2d");
var rootx = 0;
var rooty = 0;
const TILES_X = 16;
const TILES_Y = 14;
const TILE_SIZE = 32;
const centerTileX = Math.floor(TILES_X / 2);
const centerTileY = Math.floor(TILES_Y / 2);
const GAME_WIDTH = TILES_X * TILE_SIZE;   // 512
const GAME_HEIGHT = TILES_Y * TILE_SIZE;  // 448


//this makes an internal canvas that renders the game at out gamewidth and gameheight that will be scaled up to be shown on the normal canvas
const internalCanvas = document.createElement("canvas");
internalCanvas.width = GAME_WIDTH;
internalCanvas.height = GAME_HEIGHT;
const internalCtx = internalCanvas.getContext("2d");

resize();
addEventListener('resize', resize);

function resize(){
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function between(num, small, big){
    return num >= small && num <= big;
}

class Tile {
    constructor(x, y) {
        this.x=x;
        this.y=y;
    }
    onscreen(){
        return between(this.x, rootx, rootx+TILES_X) && between(this.y, rooty, rooty+TILES_Y);
    }
}

class GrassTile extends Tile {
    constructor(x,y){
        super(x,y);
        this.passable=true;
        this.type="grass";
    }
    render(ctx) {
        const screenX = (this.x - rootx) * TILE_SIZE;
        const screenY = (this.y - rooty) * TILE_SIZE;
        ctx.fillStyle = "green";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

class WaterTile extends Tile {
    constructor(x,y){
        super(x,y)
        this.passable=true;
        this.type="water";
    }
    render(ctx) {
        const screenX = (this.x - rootx) * TILE_SIZE;
        const screenY = (this.y - rooty) * TILE_SIZE;
        ctx.fillStyle = "blue";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

class OverworldPlayer {
    constructor(x,y,color){
        this.x=x;
        this.y=y;
        this.color = color;
    }
    render(ctx){
        ctx.fillStyle = "#FFDFC4";
        ctx.fillRect(centerTileX*TILE_SIZE, centerTileY*TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function generateTileMap(width = 16, height = 14) {
    const map = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // 80% grass, 20% water
            let tile;
            if (x==centerTileX && y==centerTileY){
                tile = new GrassTile(centerTileX, centerTileY);
            } else {
                tile = Math.random() < 0.2
                    ? new WaterTile(x, y)
                    : new GrassTile(x, y);
            }
            row.push(tile);
        }
        map.push(row);
    }
    return map;
}

let tiles;
let player;
function start(){
    //tiles array is stored y, x. each y row is an arraw and has the object at its x
    tiles = generateTileMap();
    player = new OverworldPlayer(centerTileX, centerTileY);
    loop();
}

function loop(){
    internalCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    tiles.forEach(row => {
        row.forEach(tile => {
            if (tile.onscreen()) tile.render(internalCtx);
        });
    });
    player.render(internalCtx);
    renderToScreen();
    requestAnimationFrame(loop);
}

function renderToScreen() { //this renders with bars to keep aspect ratio
    const scaleX = canvas.width / GAME_WIDTH;
    const scaleY = canvas.height / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const drawWidth = GAME_WIDTH * scale;
    const drawHeight = GAME_HEIGHT * scale;
    const offsetX = (canvas.width - drawWidth) / 2; //barsize
    const offsetY = (canvas.height - drawHeight) / 2; //rsize

    draw.fillStyle = "black"; // Black bars
    draw.fillRect(0, 0, canvas.width, canvas.height);

    draw.imageSmoothingEnabled = false; // does something
    draw.drawImage(
        internalCanvas,
        0, 0, GAME_WIDTH, GAME_HEIGHT,
        offsetX, offsetY, drawWidth, drawHeight
    );
}

start();