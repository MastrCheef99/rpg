var canvas = document.getElementById("canvas");
var draw = canvas.getContext("2d");
var rootx = 0;
var rooty = 0;
var up = false;
var down = false;
var left = false;
var right = false;
var toggleBox = false;
var pastTime = 0;
var movingTime = 0;
let toggleBoxCooldown = 0;
var toggleBoxCooldownReset = 15;
let functionQueue = [];
// Find your own textures
var grassTexture = new Image();
grassTexture.src = 'textures/grass.jpg';
var waterTexture = new Image();
waterTexture.src = 'textures/water.jpg';
var wallTexture = new Image();
wallTexture.src = 'textures/wall.jpg'
var floorTexture = new Image();
floorTexture.src = 'textures/floor.jpg'
var playerTextureRight = new Image();
playerTextureRight.src = 'textures/rightplayer.png'
var playerTextureLeft = new Image();
playerTextureLeft.src = 'textures/leftplayer.png'
const TILES_X = 16;
const TILES_Y = 14;
const TILE_SIZE = 32;
const centerTileX = Math.floor(TILES_X / 2);
const centerTileY = Math.floor(TILES_Y / 2);
const GAME_WIDTH = TILES_X * TILE_SIZE;   // 512
const GAME_HEIGHT = TILES_Y * TILE_SIZE;  // 448
const ENCOUNTERABLE_TILETYPES = ["grass"];

document.addEventListener('keydown', (e) => {
    if (e.repeat == false) {
        if (e.key == "ArrowUp") {
            up = true;
        }
        if (e.key == "ArrowRight") {
            right = true;
        }
        if (e.key == "ArrowDown") {
            down = true;
        }
        if (e.key == "ArrowLeft") {
            left = true;
        }
        if (e.key == "z") {
            toggleBox = true;
        }
    }
});

document.addEventListener('keyup', (e)=> {
        if (e.key == "ArrowUp") {
            up = false;
        }
        if (e.key == "ArrowRight") {
            right = false;
        }
        if (e.key == "ArrowDown") {
            down = false;
        }
        if (e.key == "ArrowLeft") {
            left = false;
        }
        if (e.key == "z") {
            toggleBox = false;
        }
    }
)

//this makes an internal canvas that renders the game at out gamewidth and gameheight that will be scaled up to be shown on the normal canvas
const internalCanvas = document.createElement("canvas");
internalCanvas.width = GAME_WIDTH;
internalCanvas.height = GAME_HEIGHT;
const internalCtx = internalCanvas.getContext("2d");

resize();
addEventListener('resize', resize);

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function between(num, small, big){
    return num >= small && num <= big;
}

function onscreen(x, y){
    return between(x, rootx, rootx+TILES_X) && between(y, rooty, rooty+TILES_Y);
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

class Tile {
    constructor(x, y) {
        this.x=x;
        this.y=y;
        this.npc=undefined;
    }
    onscreen(){
        return onscreen(this.x, this.y)
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
        // ctx.drawImage(grassTexture, screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

class WaterTile extends Tile {
    constructor(x,y){
        super(x,y)
        this.passable=false;
        this.type="water";
    }
    render(ctx) {
        const screenX = (this.x - rootx) * TILE_SIZE;
        const screenY = (this.y - rooty) * TILE_SIZE;
        ctx.fillStyle = "blue";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        // ctx.drawImage(waterTexture, screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

class WallTile extends Tile {
    constructor(x,y){
        super(x,y)
        this.passable=false;
        this.type="wall";
    }
    render(ctx) {
        const screenX = (this.x - rootx) * TILE_SIZE;
        const screenY = (this.y - rooty) * TILE_SIZE;
        ctx.fillStyle = "gray";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        // ctx.drawImage(wallTexture, screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

class FloorTile extends Tile {
    constructor(x,y){
        super(x,y);
        this.passable=true;
        this.type="floor";
    }
    render(ctx) {
        const screenX = (this.x - rootx) * TILE_SIZE;
        const screenY = (this.y - rooty) * TILE_SIZE;
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        // ctx.drawImage(floorTexture, screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

class OverworldPlayer {
    constructor(x,y,color, moveSpeed, encounterCooldown, encounterCounterPerStep, startHP, resistances){
        this.x=x;
        this.y=y;
        this.color = color;
        this.moveSpeed = moveSpeed;
        this.encounterCooldown = encounterCooldown;
        this.encounterCounter = 0;
        this.encounterCounterPerStep = encounterCounterPerStep;
        this.encounterCooldownReset = this.encounterCooldown;
        this.right = false;
        this.facing = "right";
        //Future - Make a new class for the player in battle
        this.spawnHP = startHP;
        this.hp = startHP;
        this.resistances = resistances;
    }
    render(ctx){
        ctx.fillStyle = this.color;
        const screenX = (this.x - rootx) * TILE_SIZE;
        const screenY = (this.y - rooty) * TILE_SIZE;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        // if (this.flipped) {
        //     ctx.drawImage(playerTextureRight, screenX, screenY, TILE_SIZE, TILE_SIZE);
        // } else {
        //     ctx.drawImage(playerTextureLeft, screenX, screenY, TILE_SIZE, TILE_SIZE);
        // }
    }
    move(direction){
        switch (direction) {
            case "up":
                if (this.y-1 >= 0){
                    if (tiles[this.y-1][this.x].passable){
                        this.y-=1;
                        if (rooty > 0 && this.y - rooty < centerTileY){
                            rooty-=1;
                        }
                        this.randomEncounterAdder();
                    }
                }
                break;
            case "down":
                if (this.y+1 < tiles.length){
                    if (tiles[this.y+1][this.x].passable){
                        this.y+=1;
                        if (rooty+TILES_Y < tiles.length && this.y - rooty > centerTileY){
                            rooty+=1;
                        }
                        this.randomEncounterAdder();
                    }
                }
                break;
            case "left":
                if (this.x-1>=0){
                    if (tiles[this.y][this.x-1].passable){
                        this.x-=1;
                        if (rootx > 0 && this.x - rootx < centerTileX){
                            rootx -= 1;
                        }
                        this.randomEncounterAdder();
                    }
                }
                this.flipped = false;
                break;
            case "right":
                if (this.x+1 < tiles[this.y].length){
                    if (tiles[this.y][this.x+1].passable){
                        this.x+=1;
                        if (rootx+TILES_X < tiles[0].length && this.x - rootx > centerTileX){
                            rootx += 1;
                        }
                        this.randomEncounterAdder();
                    }
                }
                this.flipped = true;
                break;
        }
        this.direction = direction;
    }
    check(){
        let key;
        switch(this.direction){
            case "up":
                key = [this.x, this.y-1].toString();
                break;
            case "down":
                key = [this.x, this.y+1].toString();
                break;
            case "left":
                key = [this.x-1, this.y].toString();
                break;
            case "right":
                key = [this.x+1, this.y].toString();
                break;
        }
        //TODO: Check for npc in the direction and toggle talking to them
    }
    randomEncounterCheck(){
            if (Math.floor(Math.random() * 256) < this.encounterCounter / 256) {
                if (this.randomEncounterStart()) {
                    console.log("Won random encounter");
                } else {
                    console.log("Lost random encounter");
                }
                this.encounterCounter = 0;
                this.encounterCooldown = this.encounterCooldownReset;
            }
    }
    randomEncounterStart(){
        console.log("Random encounter"); //this will at least start the random encounter 
        return true; //will probably return true on win, false on lose
    }
    randomEncounterAdder(){
        if (ENCOUNTERABLE_TILETYPES.includes(tiles[this.y][this.x].type)){
            this.encounterCooldown > 0 ? this.encounterCooldown -= 1 : this.encounterCounter += this.encounterCounterPerStep;
            this.randomEncounterCheck();
        }
        console.log("Encounter Counter: " + this.encounterCounter);
        console.log("Encounter Cooldown: " + this.encounterCooldown);
    }
}

//likely alright for now
class TextBox{
    constructor(text, picture, color = "blue"){
        this.text = text;
        this.picture = picture;
        this.picture == undefined ? this.picturePassed = false : this.picturePassed = true;
        this.color = color;
    }
    render(ctx, canvas){
    const boxX = canvas.width / 10;
    const boxY = canvas.height / 10;
    const boxW = canvas.width * 0.8;
    const boxH = canvas.height * 0.2;

    ctx.fillStyle = this.color;
    ctx.strokeStyle = "white";
    ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    const words = this.text.split(" ");
    let line = "", y = boxY + 30;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > boxW - 40) {
            ctx.fillText(line, boxX + (this.picturePassed ? boxH : 20), y);
            line = words[n] + " ";
            y += 20;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, boxX + (this.picturePassed ? boxH : 20), y);
    ctx.stroke();

    if (this.picturePassed) {
        ctx.drawImage(this.picture, boxX + 20, boxY + 20, boxH - 40, boxH - 40); // image square inside the box
    }

    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.fillText(this.text, boxX + (this.picturePassed ? boxH : 20), boxY + 30);
}
}

function generateTileMap(width = 100, height = 100) {
    const map = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            // 80% grass, 20% water
            let tile;
            if (x==centerTileX && y==centerTileY){
                tile = new GrassTile(centerTileX, centerTileY);
            } else {
                tile = Math.random() < 0.05
                    ? new WaterTile(x, y)
                    : new GrassTile(x, y);
            }
            row.push(tile);
        }
        map.push(row);
    }
    return map;
}

async function loadMapTiles2D(url) {
  const response = await fetch(url);
  const mapData = await response.json();

  const tiles = mapData.map((row, y) =>
    row.map((tileType, x) => {
      if (tileType === 'water') return new WaterTile(x, y);
      if (tileType === 'grass') return new GrassTile(x, y);
      if (tileType === "wall") return new WallTile(x, y);
      if (tileType === "floor") return new FloorTile(x,y);
      console.warn(`Unknown tile type "${tileType}" at (${x},${y})`);
      return null;
    })
  );

  return tiles;
}

//Probably mostly fine
function drawDialogueMenu() {
    if (!dialogueState.active) return;

    const ctx = internalCtx;

    const x = 50;
    const y = 300;
    const width = 300;
    const optionHeight = 30;
    const height = optionHeight * dialogueState.menuOptions.length + 20;

    ctx.fillStyle = "#0033cc";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.font = "18px monospace";
    ctx.textBaseline = "middle";

    dialogueState.menuOptions.forEach((option, index) => {
        if (index === dialogueState.menuIndex) {
            ctx.fillStyle = "#ffff66";
            ctx.fillRect(x + 5, y + 10 + index * optionHeight, width - 10, optionHeight);
            ctx.fillStyle = "#000000";
        } else {
            ctx.fillStyle = "#ffffff";
        }

        ctx.fillText(option, x + 10, y + 10 + index * optionHeight + optionHeight / 2);
    });
}


let tiles;
let player;
let textBoxArray = [];
let currentTextBox;
async function start(){
    //tiles array is stored y, x. each y row is an arraw and has the object at its x
    //tiles = generateTileMap();
    tiles = await loadMapTiles2D('scripts/map(5).json');
    player = new OverworldPlayer(centerTileX, centerTileY, "#FFDFC4", 10, 3, 192, 100, ["fire", "ice"]);
    textBoxArray.push(new TextBox("Hello World"));
    textBoxArray.push(new TextBox("My name is mastrcheef99"));
    loop();
}

function loop(currentTime){
    let deltatime = pastTime ? (currentTime - pastTime) / 1000 : 0.016;
    internalCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    tiles.forEach(row => {
        row.forEach(tile => {
            if (tile.onscreen()){ 
                (player.x==tile.x && player.y==tile.y) 
                ? player.render(internalCtx) 
                : tile.render(internalCtx);
            };
        });
    });

    renderToScreen();
    // Handle text boxes
    if (!currentTextBox && textBoxArray.length > 0) {
        currentTextBox = textBoxArray.shift();
    }

    if (currentTextBox) {
        currentTextBox.render(internalCtx, internalCanvas);
        renderToScreen();
        
        // Add a way to dismiss the text box (e.g., press Z)
        if (toggleBox && toggleBoxCooldown === 0) {
            currentTextBox = null;
            toggleBoxCooldown = toggleBoxCooldownReset;
        }
    }

    // Cooldown management
    if (toggleBoxCooldown > 0) {
        toggleBoxCooldown -= 1;
    }

    if (toggleBox && !currentTextBox && toggleBoxCooldown == 0){
        player.check();
    }
    if (movingTime <= 0 && !currentTextBox){
        if (up) {
            player.move("up");
            movingTime = player.moveSpeed;
        } else if (down){
            player.move("down");
            movingTime = player.moveSpeed;
        } else if (left){
            player.move("left");
            movingTime = player.moveSpeed;
        } else if (right){
            player.move("right");
            movingTime = player.moveSpeed;
        }
    }

    if (movingTime > 0){
        movingTime -= 1;
    }

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
