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
let CONTROL_X = 0;
let buttonPressed = false;
let buttonWidth = 80;
let buttonHeight = 40;
let buttonY = 0;
let SHIP_IMAGES = {};
let currentMessage = ['Place your ships'];

init();

/**
 * Initializes the game by setting up the board and chat components and registering the listener on the socket for
 * stateUpdate messages.
 */
function init() {
    let socket = io();
    setupBoard(socket);
    setupChat(socket);
    socket.on('stateUpdate', function (data) {
        state = data;
        squareCount = data.squareCount;
        CONTROL_X = (squareCount + 5) * squareSize;
        buttonY = (squareSize - 1) * squareCount;
        mode = data.mode;
        if (mode === 'placement' && data.playerState != null) {
            currentMessage = ['Place your ships'];
            canDrag = true;
            for (let i = 0; i < data.playerState.ships.length; i++) {
                data.playerState.ships[i].drawingX = CONTROL_X;
                data.playerState.ships[i].drawingY = HEIGHT / 20 + ((HEIGHT / 20) * i);
                let img = new Image();
                img.addEventListener('load', function (event) {
                    SHIP_IMAGES[data.playerState.ships[i].name] = img;
                    draw();
                });
                img.src = "img/" + data.playerState.ships[i].image;
            }
        } else if (mode === 'play') {
            if (state.playerState != null && state.playerState.isTurn) {
                currentMessage = ['Click to shoot'];
            } else {
                currentMessage = ['Waiting for opponent'];
            }
            updateOrdinance(state.playerState);
            draw();
            canDrag = false;
        } else if (mode === 'gameOver') {
            if (state.playerState != null && state.playerState.isWinner) {
                currentMessage = ["Game Over", " You Win!"];
            } else {
                currentMessage = ["Game Over", " You Lose."];
            }
            draw();
        }
    });
}

/**
 * Draws everything to the canvas.
 */
function draw() {
    let canvasElement = document.getElementById("gameCanvas");
    let drawingContext = canvasElement.getContext("2d");
    drawingContext.clearRect(0, 0, WIDTH, HEIGHT);
    drawBoard(drawingContext);
    drawShips(drawingContext);
    drawShots(drawingContext);
    drawHits(drawingContext);
    drawMessage(drawingContext);
    drawButton(drawingContext);

}

/**
 * Draws the "ready" button if the player has placed all of their ships. Once this button is clicked, it will send the
 * ready event to the server and the player will no longer be able to reposition their ships.
 * @param drawingContext
 */
function drawButton(drawingContext) {
    if (state.mode === "placement" && allShipsPlaced()) {

        drawingContext.fillStyle = "gray";

        drawingContext.fillRect(CONTROL_X, buttonY, buttonWidth, buttonHeight);
        drawingContext.font = "20px Arial";
        drawingContext.fillStyle = "black";
        drawingContext.fillText("Ready", CONTROL_X + 10, buttonY + 25);
        drawingContext.strokeStyle = "black";
        drawingContext.strokeRect(CONTROL_X, buttonY, 80, 40);
        drawingContext.strokeStyle = "white";
        drawingContext.beginPath();
        if (buttonPressed) {
            drawingContext.moveTo(CONTROL_X, buttonY);
            drawingContext.lineTo(CONTROL_X + buttonWidth, buttonY);
            drawingContext.lineTo(CONTROL_X + buttonWidth, buttonY + buttonHeight);
        } else {
            drawingContext.moveTo(CONTROL_X + buttonWidth, buttonY);
            drawingContext.lineTo(CONTROL_X + buttonWidth, buttonY + buttonHeight);
            drawingContext.lineTo(CONTROL_X, buttonY + buttonHeight);
        }
        drawingContext.stroke();
    }
}

/**
 * Returns true if all the players ships have been placed on the grid.
 * @returns {boolean}
 */
function allShipsPlaced() {
    for (let i = 0; i < state.playerState.ships.length; i++) {
        if (state.playerState.ships[i].x < 0 || state.playerState.ships[i].y < 0) {
            return false;
        }
    }
    return true;
}

/**
 * Sets up the chat socket so it can updated when we get message events on the websocket.
 * @param socket
 */
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

/**
 * Sets up the board by registering the required event listeners on the canvas object. We capture mouse events (clicks,
 * double-clicks, mouse up/down events and mouse move events) so we can move ships during placement and record shots
 * during the play mode.
 * @param socket
 */
function setupBoard(socket) {
    let canvasElement = document.getElementById("gameCanvas");
    HEIGHT = canvasElement.height;
    WIDTH = canvasElement.width;
    canvasElement.addEventListener('click', function (event) {
        if (state.playerState != null && state.playerState.isTurn && state.mode === 'play') {
            canvasLeft = canvasElement.offsetLeft + canvasElement.clientLeft;
            canvasTop = canvasElement.offsetTop + canvasElement.clientTop;

            let x = Math.floor(((event.pageX - canvasLeft) / squareSize)) + 1;
            let y = Math.floor(((event.pageY - canvasTop - BOTTOM_GRID_TOP) / squareSize)) + 1;
            if (x <= squareCount && y >= 0 && y <= squareCount) {
                socket.emit('takeTurn', {
                    playerId: state.playerState.id,
                    x: x,
                    y: y,
                    ordinance: getSelectedOrdinance()
                });
            }
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
            if (allShipsPlaced()) {
                let clickX = event.pageX - canvasLeft;
                let clickY = event.pageY - canvasTop;
                if (clickX >= CONTROL_X && clickX < CONTROL_X + buttonWidth) {
                    if (clickY >= buttonY && clickY <= buttonY + buttonHeight) {
                        buttonPressed = true;
                        draw();
                    }
                }
            }
        }
    });
    canvasElement.addEventListener('mouseup', function (event) {
        if (draggingShip != null) {
            // we dropped a ship. Snap to grid if over it.
            if (isFullyOnGrid(draggingShip)) {
                // we're in the grid, find closest anchor and snap to it
                draggingShip.x = Math.floor(draggingShip.drawingX / squareSize) + 1;
                draggingShip.drawingX = (draggingShip.x - 1) * squareSize;
                draggingShip.y = Math.floor(draggingShip.drawingY / squareSize) + 1;
                draggingShip.drawingY = (draggingShip.y - 1) * squareSize;
            } else {
                // not in the grid anymore so wipe the x,y coords
                draggingShip.x = -1;
                draggingShip.y = -1;
            }
        }
        if (buttonPressed) {
            // if Ready button was pressed, submit state to server
            socket.emit("ready", state.playerState);
            // no more ship movement allowed
            currentMessage = ['Waiting for opponent'];
            canDrag = false;
            buttonPressed = false;
        }

        draggingShip = null;
        draw();
    });

    canvasElement.addEventListener('dblclick', function (event) {
        if (state.playerState != null) {
            // if we double clicked a ship, rotate it by changing the heading
            let ship = getClickedShip(event);
            if (ship != null) {
                ship.heading = (ship.heading + 1) % 4;
                draw();
            }
        }
    });
}

/**
 * Returns true if the ship passed in is entirely within the grid (since it is illegal to have an initial position
 * that is off the grid).
 * @param ship
 * @returns {boolean}
 */
function isFullyOnGrid(ship) {
    let maxX = (squareSize * squareCount);
    let maxY = (squareSize * squareCount);

    let xSnap = Math.floor(draggingShip.drawingX / squareSize) * squareSize;
    let ySnap = Math.floor(draggingShip.drawingY / squareSize) * squareSize;

    if (xSnap <= maxX && ySnap <= maxY) {
        // the anchor point is in the grid; now make sure the rest of the ship is still on it
        switch (ship.heading) {
            case 0:
                if (xSnap + (ship.size * squareSize) <= maxX) {
                    return true;
                }
                break;
            case 1:
                if (ySnap + (ship.size * squareSize) <= maxY) {
                    return true;
                }
                break;
            case 2:
                if (xSnap - (ship.size * squareSize) >= 0) {
                    return true;
                }
                break;
            case 3:
                if (ySnap - (ship.size * squareSize) >= 0) {
                    return true;
                }
                break;
        }
    }
    return false;
}

/**
 * Gets the Ship (if any) that was clicked.
 * @param event
 * @returns {null}
 */
function getClickedShip(event) {
    let clickX = event.pageX - canvasLeft;
    let clickY = event.pageY - canvasTop;
    for (let i = 0; i < state.playerState.ships.length; i++) {
        let ship = state.playerState.ships[i];
        if (ship.heading === 0) {
            if (clickX >= ship.drawingX && clickX <= (ship.drawingX + (ship.size * squareSize))) {
                if (clickY >= ship.drawingY && clickY <= (ship.drawingY + squareSize)) {
                    return ship;
                }
            }
        } else if (ship.heading === 1) {
            if (clickX >= ship.drawingX && clickX <= ship.drawingX + squareSize) {
                if (clickY >= ship.drawingY && clickY <= ship.drawingY + (ship.size * squareSize)) {
                    return ship;
                }
            }
        } else if (ship.heading === 2) {
            if (clickX <= ship.drawingX && clickX >= (ship.drawingX - (ship.size * squareSize))) {
                if (clickY >= ship.drawingY && clickY <= (ship.drawingY + squareSize)) {
                    return ship;
                }
            }
        } else {
            if (clickX >= ship.drawingX && clickX <= ship.drawingX + squareSize) {
                if (clickY <= ship.drawingY && clickY >= ship.drawingY - (ship.size * squareSize)) {
                    return ship;
                }
            }
        }
    }
    return null;
}

/**
 * Draws the current message to the canvas. The currentMessage is an array and each line is drawn on its own line.
 * @param drawingContext
 */
function drawMessage(drawingContext) {
    if (currentMessage != null) {
        drawingContext.font = "22px Arial";
        drawingContext.fillStyle = "black";
        for (let i = 0; i < currentMessage.length; i++) {
            drawingContext.fillText(currentMessage[i], (squareSize * squareCount) + 10, BOTTOM_GRID_TOP + ((2 + (i + 1)) * squareSize));
        }
    }
}

/**
 * Draws all ships for a player.
 * @param drawingContext
 */
function drawShips(drawingContext) {
    if (state.playerState != null) {
        for (let idx = 0; idx < state.playerState.ships.length; idx++) {
            drawShip(state.playerState.ships[idx], drawingContext);
        }
    }
}

/**
 * Draws a single ship onto the ship grid (top grid).
 * @param ship
 * @param drawingContext
 */
function drawShip(ship, drawingContext) {
    let shipY = ship.drawingY;
    let shipX = ship.drawingX;
    if (state.mode != 'placement') {
        shipY = toDrawingCoordinate(ship.y, 0);
        shipX = toDrawingCoordinate(ship.x, 0);
    }
    let centerX = shipX;
    let centerY = shipY;
    switch (ship.heading) {
        case 0:
            centerX = shipX;
            centerY = shipY;
            break;
        case 1:
            centerX = shipX + squareSize;
            centerY = shipY;
            break;
        case 2:
            centerX = shipX + squareSize;
            centerY = shipY + squareSize;
            break;
        case 3:
            centerX = shipX;
            centerY = shipY + squareSize;
            break;
    }

    if (SHIP_IMAGES[ship.name] !== undefined) {
        drawingContext.translate(centerX, centerY);
        drawingContext.rotate(ship.heading * ROTATION_RADIANS);
        drawingContext.drawImage(SHIP_IMAGES[ship.name], 0, 0);
        drawingContext.setTransform();
    }
}

/**
 * Draws the players shots on the bottom grid. Shots are either hits (red) or missed (white) and have an age (turns since
 * the shot was fired).
 * @param drawingContext
 */
function drawShots(drawingContext) {
    if (state.playerState != null) {
        for (let i = 0; i < state.playerState.shots.length; i++) {
            let shot = state.playerState.shots[i];
            let color = "white";
            if (shot.isHit) {
                color = "red";
            }
            drawingContext.fillStyle = color;
            let x = toDrawingCoordinate(shot.x, 0);
            let y = toDrawingCoordinate(shot.y, BOTTOM_GRID_TOP);
            drawingContext.fillRect(x, y, squareSize, squareSize);
            drawingContext.font = "12px Arial";
            drawingContext.fillStyle = "black";
            drawingContext.fillText("" + Math.floor((state.turnNumber - shot.turnNumber) / 2), x + 8, y + 10);
        }
    }
}

/**
 * Draws the hits onto the top (ship) grid. Hits represent which of the player's ships have been hit so far.
 * @param drawingContext
 */
function drawHits(drawingContext) {
    if (state.playerState != null) {
        for (let i = 0; i < state.playerState.ships.length; i++) {
            let ship = state.playerState.ships[i];

            drawingContext.fillStyle = "red";
            //if there are hits, render them

            for (let j = 0; j < ship.hits.length; j++) {
                let x = ship.x;
                let y = ship.y;
                if (ship.hits[j] === 1) {
                    switch (ship.heading) {
                        case 0:
                            x = x + j;
                            break;
                        case 1:
                            y = y + j;
                            break;
                        case 2:
                            x = x - j;
                            break;
                        case 3:
                            y = y - j;
                            break;
                    }
                    drawingContext.fillRect(toDrawingCoordinate(x, 0) + (squareSize / 4), toDrawingCoordinate(y, 0) + (squareSize / 4), squareSize / 2, squareSize / 2);
                }

            }
        }
    }
}

/**
 * Draws both ship grids.
 * @param drawingContext
 */
function drawBoard(drawingContext) {
    drawGrid(0, squareSize, squareCount, drawingContext);
    drawGrid(BOTTOM_GRID_TOP, squareSize, squareCount, drawingContext);
}


/**
 * Draws the ship grid starting at the Y position passed in.
 * @param startY
 * @param size
 * @param count
 * @param drawingContext
 */
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


/**
 * Translates a grid coordinate to a drawing coordinate with the canvas. The offset is used to pad the start position
 * so we can use this function to get drawing coordinates for grid coordinates in either the top or bottom grid.
 * @param gridCoord
 * @param offset
 * @returns {*}
 */
function toDrawingCoordinate(gridCoord, offset) {
    return ((gridCoord - 1) * squareSize) + offset;
}


function getSelectedOrdinance() {
    let radio = document.getElementsByName("ordinance");
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked) {
            return radio[i].value.toLowerCase();
        }
    }
    return null;
}


function updateOrdinance(playerState) {
    let radio = document.getElementsByName("ordinance");
    for (let i = 0; i < radio.length; i++) {
        if (playerState.depletedOrdinance !== undefined) {
            for (let j = 0; j < playerState.depletedOrdinance.length; j++) {
                if (radio[i].value.toLowerCase() === "shell") {
                    radio[i].checked = true;
                }
                if (radio[i].value.toLowerCase() === playerState.depletedOrdinance[j].toLowerCase()) {
                    radio[i].disabled = true;
                }
            }
        }
    }
}