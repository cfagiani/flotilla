let squareSize = 20;
let squareCount = 0;
let mode = 'placement';
let state = {playerState: null};
let HEIGHT = 0;
let WIDTH = 0;

init();

function init() {
    setupBoard();
    let socket = io();
    setupChat(socket);
    socket.on('stateUpdate', function (data) {
        state = data;
        squareCount = data.squareCount;
        mode = data.mode;
        draw();
    });
}


function draw() {
    let canvasElement = document.getElementById("gameCanvas");
    HEIGHT = canvasElement.height;
    WIDTH = canvasElement.width;
    let drawingContext = canvasElement.getContext("2d");
    drawBoard(drawingContext);
    drawShips(drawingContext);
    drawShots(drawingContext);
    drawMessage(drawingContext);
}


function setupChat(socket) {
    let chatText = document.getElementById('chatText');
    let chatInput = document.getElementById('chatInput');
    let chatForm = document.getElementById('chatForm');

    socket.on('addToChat', function (data) {
        chatText.innerHTML += '<div>' + data + '</div>';
    });

    chatForm.onsubmit = function (e) {
        e.preventDefault();
        socket.emit('sendMsgToServer', chatInput.value);
        chatInput.value = '';
    }
}

function setupBoard() {
    let canvasElement = document.getElementById("gameCanvas");
    canvasElement.addEventListener('click', function (event) {
        let elemLeft = canvasElement.offsetLeft + canvasElement.clientLeft;
        let elemTop = canvasElement.offsetTop + canvasElement.clientTop;

        let x = Math.floor(((event.pageX - elemLeft) / squareSize)) + 1;
        let y = Math.floor(((event.pageY - elemTop) / squareSize)) + 1;
        if (x <= squareCount && y <= squareCount) {
            console.log(x + ", " + y);
        } else {
            console.log("OOB");
        }

    }, false)
}

function drawMessage(drawingContext) {

}

function drawShips(drawingContext) {
    if (state.playerState != null) {
        for (let idx = 0; idx < state.playerState.ships.length; idx++) {
            drawShip(state.playerState.ships[idx], idx, drawingContext);
        }
    }
}

function drawShip(ship, offset, drawingContext) {
    if (ship.x < 0 || ship.y < 0) {
        //ship is not placed, draw it in the initial position
        drawingContext.fillStyle = "black";
        drawingContext.fillRect((squareCount + 5) * squareSize, HEIGHT / 20 + ((HEIGHT / 20) * offset),
            squareSize * ship.size, squareSize);
    }
}

function drawShots(drawingContext) {
}

function drawBoard(drawingContext) {
    drawGrid(0, squareSize, squareCount, drawingContext);
    drawGrid(300, squareSize, squareCount, drawingContext);
}

function drawGrid(startY, size, count, drawingContext) {
    drawingContext.fillStyle = "blue";
    drawingContext.fillRect(0, startY, size * count, size * count)
    drawingContext.strokeStyle = "black";
    drawingContext.lineWidth = 1;
    for (let i = 0; i < count; i++) {
        for (let j = 0; j < count; j++) {
            drawingContext.beginPath();
            drawingContext.rect(j * size, startY + (i * size), size, size);
            drawingContext.stroke();
        }
    }
}


