
var timer;

//set difficulty levels
var DIFFICULTY = {
    Easy: {
        Columns: 9,
        Rows: 9,
        Mines: 10
    },
    Medium: {
        Columns: 16,
        Rows: 16,
        Mines: 40
    },
    Hard: {
        Columns: 30,
        Rows: 16,
        Mines: 99
    }
};
var _currDifficulty = DIFFICULTY.Easy;

//game status
var Game = function Game() {
    this.isFirstClick = true;
    this.totalRevealed = 0;
    this.mineLocations = [];
    this.tilesInfo = [];
    this.timeValue = 0;
    this.docElement = null;
    
    this.start = function(){
        this.tilesInfo = [];
        if(timer !== null)
            window.clearInterval(timer);
        //create a massage div
        previous = document.getElementById("completionTime");
        previousMSG = document.getElementById("messageEl");
        if (previousMSG) {
            previousMSG.innerHTML = "";
            if (previous)
                previous.innerHTML = "";
            return;
        }
        var grid = document.getElementById("minefield");
        grid = grid.parentElement;
        var completionTime = document.createElement("div");
        completionTime.id = "completionTime";
        var messageEl = document.createElement("div");
        messageEl.id = "messageEl";
        grid.appendChild(completionTime);
        grid.appendChild(messageEl);
    };

    this.end = function(){
        //remove all listeners
        var grid = document.getElementById("minefield");
        allTiles = grid.children;
        for (var i = 0; i < allTiles.length; i++) {
            t = allTiles[i];
            t.removeEventListener("mouseup", handleTileClick); // All Clicks
            t.removeEventListener("mousedown", limboFace); // All Clicks
            window.clearInterval(timer);
            timer = null;
        }
        
    };
};
var game = null;

var Tile = function Tile() {
    this.isHidden = true;
    this.isMine = false;
    this.isFlagged = false;
    this.adjTiles = []; //indexes of adjacent tiles
    this.adjMines = 0;
    this.adjFlags = 0;
};

function buildGrid() {
    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    // Build DOM Grid
    var tile;
    var index = 0;
    for (var y = 0; y < _currDifficulty.Rows; y++) {
        for (var x = 0; x < _currDifficulty.Columns; x++) {
            tile = createTile(x, y);
            tile.id = "tile" + index;
            index++;
            grid.appendChild(tile);
        }
    }

    var style = window.getComputedStyle(tile);
    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));
    grid.style.width = (_currDifficulty.Columns * width) + "px";
    grid.style.height = (_currDifficulty.Rows * height) + "px";
}

function createTile(x,y) {
    var tile = document.createElement("div");

    tile.classList.add("tile");
    tile.classList.add("hidden");
    
    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mouseup", handleTileClick ); // All Clicks
    tile.addEventListener("mousedown", limboFace); // All Clicks

    info = new Tile;
    info.adjTiles = adjacentTiles(x+(_currDifficulty.Columns*y));
    game.tilesInfo.push(info);
    return tile;
}

function startGame() {
    var smiley = document.getElementById("smiley");
    smiley.classList = "";
    smiley.classList.add("smiley");

    game = new Game;
    game.start();

    buildGrid();
    updateFlagCount();
    updateTimer();
}

//place mines randomly BUT not in places in "list"
function placeMines(list) {
    var totalMinesLeft = _currDifficulty.Mines;
    var totalTiles = _currDifficulty.Rows * _currDifficulty.Columns;
    
    while (totalMinesLeft > 0) {
        var index = Math.floor(Math.random() * totalTiles);
        if (game.tilesInfo[index].isMine || list.indexOf(index) > -1) {
            continue;
        }

        var adj = game.tilesInfo[index].adjTiles;
        game.tilesInfo[index].isMine = true;
        game.mineLocations.push(index);
        
        //update tiles info 
        for (var i = 0; i < adj.length; i++) {
            game.tilesInfo[adj[i]].adjMines++;
        }
        totalMinesLeft--;
    }
}

/** returns adjacent tiles to location loc
*/
function adjacentTiles(loc) {
    var adjTiles = [];
    var totalTileInd = (_currDifficulty.Columns * _currDifficulty.Rows) - 1;
    //horizontal
    if ((loc - 1) >= 0 && (loc - 1) % _currDifficulty.Columns != _currDifficulty.Columns - 1) {
        adjTiles.push(loc - 1);
    }
    if ((loc + 1) <= totalTileInd && (loc + 1) % _currDifficulty.Columns != 0) {
        adjTiles.push(loc + 1);
    }

    //vertical
    if (loc - _currDifficulty.Columns >= 0) {
        adjTiles.push(loc - _currDifficulty.Columns);
    }
    if (loc + _currDifficulty.Columns <= totalTileInd) {
        adjTiles.push(loc + _currDifficulty.Columns);
    }

    //diagonal
    if (loc - _currDifficulty.Columns - 1 >= 0 &&
        (loc - _currDifficulty.Columns - 1) % _currDifficulty.Columns != _currDifficulty.Columns - 1) {
        adjTiles.push(loc - _currDifficulty.Columns - 1);
    }
    if (loc - _currDifficulty.Columns + 1 >= 0 &&
        (loc - _currDifficulty.Columns + 1) % _currDifficulty.Columns != 0) {
        adjTiles.push(loc - _currDifficulty.Columns + 1);
    }
    if (loc + _currDifficulty.Columns - 1 <= totalTileInd &&
        (loc + _currDifficulty.Columns - 1) % _currDifficulty.Columns != _currDifficulty.Columns - 1) {
        adjTiles.push(loc + _currDifficulty.Columns - 1);
    }
    if (loc + _currDifficulty.Columns + 1 <= totalTileInd &&
        (loc + _currDifficulty.Columns + 1) % _currDifficulty.Columns != 0) {
        adjTiles.push(loc + _currDifficulty.Columns + 1);
    }

    return adjTiles;
}

function limboFace(event) {
    var smiley = document.getElementById("smiley");

    if (event.which === 1 && this.classList.contains("hidden") && !isFlagged(this)) {
        smiley.classList.add("face_limbo");
    }
    if (event.which === 2 && !this.classList.contains("hidden") && !isFlagged(this)) {
        smiley.classList.add("face_limbo");
    }
    
}

function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}

function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_down");
}

function revealTiles(loc) {
    var tile = document.getElementById("tile" + loc);
    if (isFlagged(tile) || !game.tilesInfo[loc].isHidden)
        return;

    tile.classList.remove("hidden");
    game.tilesInfo[loc].isHidden = false;

    if (game.tilesInfo[loc].isMine) {
        //revealed a mine location. game over
        gameOver(tile);
        return;
    }

    //reveal adjacent tiles in case if it is empty
    else if (game.tilesInfo[loc].adjMines === 0) {
        var adj = game.tilesInfo[loc].adjTiles;
        for (var i = 0; i < adj.length; i++) {
            var nextTile = document.getElementById("tile" + adj[i]);
            if (nextTile.classList.contains("hidden")) {
                revealTiles(adj[i]);
            }
        }
    } else {
        tile.classList.add("tile_" + game.tilesInfo[loc].adjMines);
    }
    game.totalRevealed++;
    var totalTiles = _currDifficulty.Columns * _currDifficulty.Rows;
    if (game.totalRevealed === totalTiles - _currDifficulty.Mines)
        youWin();
}

function handleTileClick(event) {
    var smiley = document.getElementById("smiley");
    if(smiley.classList.contains("face_limbo"))
        smiley.classList.remove("face_limbo");

    tileInd = parseInt(this.id.slice(4));
    // Left Click
    if (event.which === 1) {
        //TODO reveal the tile
        if (isFlagged(this)) {
            return;
        }

        if (game.isFirstClick) {
            //this is the first left click; no adjacent mines
            startTimer();
            var adj = game.tilesInfo[tileInd].adjTiles;
            adj.push(tileInd);
            placeMines(adj);
            game.isFirstClick = false;
        }
        revealTiles(tileInd);
    }
    // Middle Click
    else if (event.which === 2) {
        //TODO try to reveal adjacent tiles
        if (isFlagged(this)) {
            return;
        }
        //reveal tiles only if current tile is revealed with a number
        //and adjacent flags matches that number 
        if(!game.tilesInfo[tileInd].isHidden && game.tilesInfo[tileInd].adjMines > 0 && 
            game.tilesInfo[tileInd].adjFlags === game.tilesInfo[tileInd].adjMines) {
            var adj = game.tilesInfo[tileInd].adjTiles;
            for (var i = 0; i < adj.length; i++) {
                revealTiles(adj[i]);
            }
        }
        

    }
    // Right Click
    else if (event.which === 3) {
        //TODO toggle a tile flag
        if(!game.tilesInfo[tileInd].isHidden)
            return;
        updateFlagInfo(tileInd);
        toggleFlag(this);  
    }    
}

function updateFlagInfo(tileInd) {
    if (game.tilesInfo[tileInd].isFlagged) {
        game.tilesInfo[tileInd].isFlagged = false;
        //update adjacents
        var adj = game.tilesInfo[tileInd].adjTiles;
        for (var i = 0; i < adj.length; i++) {
            if (game.tilesInfo[adj[i]].adjFlags > 0)
                game.tilesInfo[adj[i]].adjFlags--;
        }
    } else {
        game.tilesInfo[tileInd].isFlagged = true;
        //update adjacents
        var adj = game.tilesInfo[tileInd].adjTiles;
        for (var i = 0; i < adj.length; i++) {
            game.tilesInfo[adj[i]].adjFlags++;
        }
    }
}

function isFlagged(tile) {
    return tile.classList.contains("flag");
}

function toggleFlag(tile){
    if (isFlagged(tile)) {
        tile.classList.remove("flag");
    } else if(tile.classList.contains("hidden")) {
        tile.classList.add("flag");
    }
    updateFlagCount();
}

function setDifficulty() {
    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;

    //TODO implement me
    switch(difficulty)
    {
        case 1://Medium level
            _currDifficulty = DIFFICULTY.Medium;
            startGame();
            break;

        case 2://Hard level
            _currDifficulty = DIFFICULTY.Hard;
            startGame;
            break;

        default://Easy level
            _currDifficulty = DIFFICULTY.Easy;
            startGame();
            break;

    }
}

function updateFlagCount() {
    var totalFlagged = document.getElementsByClassName("flag");
    document.getElementById("flagCount").innerHTML = _currDifficulty.Mines - totalFlagged.length;
}

function startTimer() {
    game.timeValue = 0;
    timer = window.setInterval(onTimerTick, 1000);
}

function onTimerTick() {
    game.timeValue++;
    updateTimer();
}

function updateTimer() {
    document.getElementById("timer").innerHTML = game.timeValue;
}

function youWin() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_win");

    //display message
    var completionTime = document.getElementById("completionTime");
    var message = document.getElementById("messageEl");
    message.innerHTML = "<h1>YOU WIN!</h1>"
    completionTime.innerHTML = "completion Time: " + game.timeValue;
 
    game.end();
}

function gameOver(tile) {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_lose");
    //display the mines
    tile.classList.add("mine_hit");
    for (var i = 0; i < game.mineLocations.length; i++) {
        otherTileInfo = game.tilesInfo[game.mineLocations[i]];
        otherTile = document.getElementById("tile" + game.mineLocations[i]);
        if (!otherTileInfo.isFlagged) {
            otherTile.classList.add("mine");
        }
    }

    flaggedTiles = document.getElementsByClassName("flag");
    for (var i = 0; i < flaggedTiles.length; i++) {
        var ind = parseInt(flaggedTiles[i].id.slice(4));
        if (!game.tilesInfo[ind].isMine)
            flaggedTiles[i].classList.add("mine_marked");
    }
   
    //display message
    var message = document.getElementById("messageEl");
    message.innerHTML = "<h1>YOU LOSE!</h1>"
 
    game.end();
}