let squareSize = 20;
let squareCount = 0;
let mode = 'placement';
let state = {playerState: null};
let HEIGHT = 0;
let WIDTH = 0;
let canDrag = false;
let canvasLeft = 0;
let canvasTop = 0;
let draggingShip = null;
let BOTTOM_GRID_TOP = 300;
let ROTATION_RADIANS = (Math.PI / 180) * 90;


init();

function init() {
    setupBoard();

    let socket = io();
    setupChat(socket);
    socket.on('stateUpdate', function (data) {
        state = data;
        squareCount = data.squareCount;
        mode = data.mode;
        if (mode === 'placement' && data.playerState != null) {
            canDrag = true;
            for (let i = 0; i < data.playerState.ships.length; i++) {
                data.playerState.ships[i].drawingX = (squareCount + 5) * squareSize;
                data.playerState.ships[i].drawingY = HEIGHT / 20 + ((HEIGHT / 20) * i);
            }
        }
        draw();
    });
}


function draw() {
    let canvasElement = document.getElementById("gameCanvas");
    let drawingContext = canvasElement.getContext("2d");
    drawingContext.clearRect(0, 0, WIDTH, HEIGHT);
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
    HEIGHT = canvasElement.height;
    WIDTH = canvasElement.width;
    canvasElement.addEventListener('click', function (event) {
        canvasLeft = canvasElement.offsetLeft + canvasElement.clientLeft;
        canvasTop = canvasElement.offsetTop + canvasElement.clientTop;

        let x = Math.floor(((event.pageX - canvasLeft) / squareSize)) + 1;
        let y = Math.floor(((event.pageY - canvasTop) / squareSize)) + 1;
        if (x <= squareCount && y <= squareCount) {
            //TODO handle shot
            console.log(x + ", " + y);
        }

    }, false);

    canvasElement.addEventListener('mousemove', function (event) {
        if (draggingShip != null) {
            let mouseX = event.pageX - canvasLeft;
            let mouseY = event.pageY - canvasTop;
            if (mouseX >= 0) {
                draggingShip.drawingX = mouseX;
            }
            if (mouseY + squareSize <= BOTTOM_GRID_TOP) {
                draggingShip.drawingY = mouseY;
            }
            draw();
        }
    });

    canvasElement.addEventListener('mousedown', function (event) {
        if (canDrag && state.playerState != null) {
            draggingShip = getClickedShip(event);
        }
    });
    canvasElement.addEventListener('mouseup', function (event) {
        if (draggingShip != null) {
            // we dropped a ship. Snap to grid if over it.
            if (draggingShip.drawingX <= (squareSize * squareCount) &&
                draggingShip.drawingY <= (squareSize * squareCount)) {
                // we're in the grid, find closest anchor and snap to it
                draggingShip.x = Math.floor(draggingShip.drawingX / squareSize);
                draggingShip.drawingX = draggingShip.x * squareSize;
                draggingShip.y = Math.floor(draggingShip.drawingY / squareSize);
                draggingShip.drawingY = draggingShip.y * squareSize;
                draw();
            }
        }
        draggingShip = null;
    });

    canvasElement.addEventListener('dblclick', function (event) {
        if (state.playerState != null) {
            // if we double clicked a ship, rotate it by changing the heading
            let ship = getClickedShip(event);
            if (ship != null) {
                ship.heading = ship.heading + 1 % 4;
            }
        }
    });

}

function getClickedShip(event) {
    let clickX = event.pageX - canvasLeft;
    let clickY = event.pageY - canvasTop;
    for (let i = 0; i < state.playerState.ships.length; i++) {
        let ship = state.playerState.ships[i];
        if (clickX >= ship.drawingX && clickX <= (ship.drawingX + (ship.size * squareSize))) {
            if (clickY >= ship.drawingY && clickY <= (ship.drawingY + squareSize)) {
                return ship;
            }
        }
    }
    return null;
}

function drawMessage(drawingContext) {

}

function drawShips(drawingContext) {
    if (state.playerState != null) {
        for (let idx = 0; idx < state.playerState.ships.length; idx++) {
            drawShip(state.playerState.ships[idx], drawingContext);
        }
    }
}

function drawShip(ship, drawingContext) {
    drawingContext.fillStyle = "black";
    drawingContext.fillRect(ship.drawingX, ship.drawingY,
        squareSize * ship.size, squareSize);
}

function drawShots(drawingContext) {
}

function drawBoard(drawingContext) {
    drawGrid(0, squareSize, squareCount, drawingContext);
    drawGrid(BOTTOM_GRID_TOP, squareSize, squareCount, drawingContext);
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


