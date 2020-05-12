// constants
let SQUARE_SIZE = 20;
let BOTTOM_GRID_TOP = 300;
let ROTATION_RADIANS = (Math.PI / 180) * 90;
let ALPHA_FACTOR = 0.2;
let BUTTON_WIDTH = 80;
let BUTTON_HEIGHT = 40;

// Values that are only set once
let HEIGHT = 0;
let WIDTH = 0;
let CONTROL_X = 0;
let SHIP_IMAGES = {};
let BUTTON_Y = 0;
let CANVAS_LEFT = 0;
let CANVAS_RIGHT = 0;


// Global state
let state = {playerState: null};
let canDrag = false;
let draggingShip = null;
let buttonPressed = false;
let currentMessage = ['Place your ships'];
let socket = null;


init();

/**
 * Initializes the game by setting up the board and chat components and registering the listener on the socket for
 * stateUpdate messages.
 */
function init() {
    socket = io();
    socket.emit('join', window.location.href);
    setupBoard(socket);
    setupChat(socket);
    socket.on('stateUpdate', handleStateUpdate);
}


/**
 * Handles the state update message. The server sends stateUpdates for basically every change that occurs. This
 * method will dispatch to the correct function based on the game mode and player's role.
 * @param data
 */
function handleStateUpdate(data) {
    if (state.playerState == null) {
        setupInitialState(data)
    } else {
        state = data;
    }
    switch (state.mode) {
        case 'placement':
            handlePlacementModeUpdate();
            break;
        case 'play':
            handlePlayModeUpdate();
            break;
        case 'gameOver':
            handleGameOverUpdate();
            break;
    }
    draw();
}

/**
 * Updates the UI for "placement" mode. In placement mode, the two players position their ships on the playing grid.
 * Observers simply wait for the game to begin.
 *
 */
function handlePlacementModeUpdate() {
    // reset the ordinance to defaults
    updateOrdinance(null);
    if (state.playerState.role === 'observer') {
        currentMessage = ['Your are observing'];
        canDrag = false;
    } else {
        currentMessage = ['Place your ships'];
        canDrag = true;
    }
    for (let i = 0; i < state.playerState.ships.length; i++) {
        state.playerState.ships[i].drawingX = CONTROL_X;
        state.playerState.ships[i].drawingY = HEIGHT / 20 + ((HEIGHT / 20) * i);
    }
}

/**
 * Handles updating the UI for 'play' mode. In this mode, the two players take turns shooting at their opponent. The
 * shots (hits/misses) are rendered on the lower grid whereas the position of the player's ships and their hit status
 * are rendered on the upper grid.
 */
function handlePlayModeUpdate() {
    if (state.playerState.role === 'player') {
        if (state.playerState.isTurn) {
            currentMessage = ['Click to shoot'];
        } else {
            currentMessage = ['Waiting for opponent'];
        }
        updateOrdinance(state.playerState);
        canDrag = false;
    } else {
        if (state.observationState !== undefined) {
            let turnNum = -1;
            for (let i = 0; i < state.observationState.length; i++) {
                if (state.observationState[i].isTurn) {
                    turnNum = state.observationState[i].num;
                }
            }
            if (turnNum > 0) {
                currentMessage = ["Player " + turnNum + "'s turn"];
            }
        }
    }
}

/**
 * Handles the GameOver mode. This just displays a message indicating who won.
 */
function handleGameOverUpdate() {
    if (state.playerState != null && state.playerState.isWinner) {
        currentMessage = ["Game Over", " You Win!"];
    } else if (state.playerState.role === 'player') {
        currentMessage = ["Game Over", " You Lose."];
    } else {
        currentMessage = ["Game Over"];
    }
}

/**
 * Sets fields that are only set once on first load. This includes things like loading image files for ships, setting
 * the control pixel offsets (since the position is based on number of squares to use for the grid which comes
 * from the server).
 * @param data
 */
function setupInitialState(data) {
    state = data;
    CONTROL_X = (data.squareCount + 5) * SQUARE_SIZE;
    BUTTON_Y = (SQUARE_SIZE - 1) * data.squareCount;
    let shipsToLoad = data.playerState.ships;
    if (data.playerState.role === 'observer' && data.observationState !== undefined) {
        shipsToLoad = data.observationState[0].ships;
    }
    for (let i = 0; i < shipsToLoad.length; i++) {
        loadShipImage(shipsToLoad[i]);
    }
}

/**
 * Loads the image for a ship, if it has not yet been loaded and stores it in the SHIP_IMAGES global object.
 * @param ship
 */
function loadShipImage(ship) {
    if (SHIP_IMAGES[ship.name] === undefined) {
        let img = new Image();
        img.addEventListener('load', function (event) {
            SHIP_IMAGES[ship.name] = img;
            draw();
        });
        img.src = "/img/" + ship.image;
    }
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
    drawIntel(drawingContext);
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
        if (state.playerState != null && state.playerState.role === 'observer') {
            return;
        }
        drawingContext.fillStyle = "gray";

        drawingContext.fillRect(CONTROL_X, BUTTON_Y, BUTTON_WIDTH, BUTTON_HEIGHT);
        drawingContext.font = "20px Arial";
        drawingContext.fillStyle = "black";
        drawingContext.fillText("Ready", CONTROL_X + 10, BUTTON_Y + 25);
        drawingContext.strokeStyle = "black";
        drawingContext.strokeRect(CONTROL_X, BUTTON_Y, 80, 40);
        drawingContext.strokeStyle = "white";
        drawingContext.beginPath();
        if (buttonPressed) {
            drawingContext.moveTo(CONTROL_X, BUTTON_Y);
            drawingContext.lineTo(CONTROL_X + BUTTON_WIDTH, BUTTON_Y);
            drawingContext.lineTo(CONTROL_X + BUTTON_WIDTH, BUTTON_Y + BUTTON_HEIGHT);
        } else {
            drawingContext.moveTo(CONTROL_X + BUTTON_WIDTH, BUTTON_Y);
            drawingContext.lineTo(CONTROL_X + BUTTON_WIDTH, BUTTON_Y + BUTTON_HEIGHT);
            drawingContext.lineTo(CONTROL_X, BUTTON_Y + BUTTON_HEIGHT);
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
function setupBoard() {
    let canvasElement = document.getElementById("gameCanvas");

    HEIGHT = canvasElement.height;
    WIDTH = canvasElement.width;
    CANVAS_LEFT = canvasElement.offsetLeft + canvasElement.clientLeft;
    CANVAS_RIGHT = canvasElement.offsetTop + canvasElement.clientTop;

    canvasElement.addEventListener('click', takeTurn, false);
    canvasElement.addEventListener('mousemove', dragShip);

    canvasElement.addEventListener('mousedown', function (event) {
        pickUpShip(event);
        handleButtonDown(event);

    });
    canvasElement.addEventListener('mouseup', function (event) {
        dropShip(event);
        handleButtonUp(event);
        draw();
    });
    canvasElement.addEventListener('dblclick', rotateShip);
}

/**
 * Handles a double-click event by rotating ship if we're in placement mode and the even occured on a ship.
 * @param event
 */
function rotateShip(event) {
    if (state.playerState != null) {
        // if we double clicked a ship, rotate it by changing the heading
        let ship = getClickedShip(event);
        if (ship != null) {
            ship.heading = (ship.heading + 1) % 4;
            draw();
        }
    }
}

/**
 * Checks if the mouse down event was within the button and, if so, updates the UI to show its down state.
 * @param event
 */
function handleButtonDown(event) {
    if (state.mode === 'placement' && state.playerState != null) {
        if (allShipsPlaced()) {
            let clickX = event.pageX - CANVAS_LEFT;
            let clickY = event.pageY - CANVAS_RIGHT;
            if (clickX >= CONTROL_X && clickX < CONTROL_X + BUTTON_WIDTH) {
                if (clickY >= BUTTON_Y && clickY <= BUTTON_Y + BUTTON_HEIGHT) {
                    buttonPressed = true;
                    draw();
                }
            }
        }
    }
}

/**
 * Handles mouse-up if the event occurs while the user was clicking the button by firing the "ready" event.
 * @param event
 */
function handleButtonUp(event) {
    if (buttonPressed) {
        // if Ready button was pressed, submit state to server
        socket.emit("ready", state.playerState);
        // no more ship movement allowed
        currentMessage = ['Waiting for opponent'];
        canDrag = false;
        buttonPressed = false;
    }
}

/**
 * Handles a mouse-down event by selecting a ship to drag if dragging is allowed and the event was within a ship.
 * @param event
 */
function pickUpShip(event) {
    if (canDrag && state.playerState != null) {
        draggingShip = getClickedShip(event);
    }
}

/**
 * Handles mouse-up event by dropping a ship (if we were dragging one) and snapping it to the grid if it was dropped
 * on the grid.
 * @param event
 */
function dropShip(event) {
    if (draggingShip != null) {
        // we dropped a ship. Snap to grid if over it.
        if (isFullyOnGrid(draggingShip)) {
            // we're in the grid, find closest anchor and snap to it
            draggingShip.x = Math.floor(draggingShip.drawingX / SQUARE_SIZE) + 1;
            draggingShip.drawingX = (draggingShip.x - 1) * SQUARE_SIZE;
            draggingShip.y = Math.floor(draggingShip.drawingY / SQUARE_SIZE) + 1;
            draggingShip.drawingY = (draggingShip.y - 1) * SQUARE_SIZE;
        } else {
            // not in the grid anymore so wipe the x,y coords
            draggingShip.x = -1;
            draggingShip.y = -1;
        }
    }
    draggingShip = null;
}

/**
 * Handles a mouse move event by rendering a ship dragged across the canvas.
 * @param event
 */
function dragShip(event) {
    if (draggingShip != null) {
        let mouseX = event.pageX - CANVAS_LEFT;
        let mouseY = event.pageY - CANVAS_RIGHT;
        if (mouseX >= 0) {
            draggingShip.drawingX = mouseX;
        }
        if (mouseY + SQUARE_SIZE <= BOTTOM_GRID_TOP) {
            draggingShip.drawingY = mouseY;
        }
        draw();
    }
}

/**
 * Handles the click event for the canvas. This is used to take a turn (fire a shot). If we are not in play mode or
 * it is not the player's turn, clicks are ignored.
 * @param event
 */
function takeTurn(event) {
    if (state.playerState != null && state.playerState.isTurn && state.mode === 'play') {
        let x = Math.floor(((event.pageX - CANVAS_LEFT) / SQUARE_SIZE)) + 1;
        let y = Math.floor(((event.pageY - CANVAS_RIGHT - BOTTOM_GRID_TOP) / SQUARE_SIZE)) + 1;
        if (x <= state.squareCount && y >= 0 && y <= state.squareCount) {
            socket.emit('takeTurn', {
                playerId: state.playerState.id,
                x: x,
                y: y,
                ordinance: getSelectedOrdinance()
            });
        }
    }
}


/**
 * Returns true if the ship passed in is entirely within the grid (since it is illegal to have an initial position
 * that is off the grid).
 * @param ship
 * @returns {boolean}
 */
function isFullyOnGrid(ship) {
    let maxX = (SQUARE_SIZE * state.squareCount);
    let maxY = (SQUARE_SIZE * state.squareCount);

    let xSnap = Math.floor(draggingShip.drawingX / SQUARE_SIZE) * SQUARE_SIZE;
    let ySnap = Math.floor(draggingShip.drawingY / SQUARE_SIZE) * SQUARE_SIZE;

    if (xSnap <= maxX && ySnap <= maxY) {
        // the anchor point is in the grid; now make sure the rest of the ship is still on it
        switch (ship.heading) {
            case 0:
                if (xSnap + (ship.size * SQUARE_SIZE) <= maxX) {
                    return true;
                }
                break;
            case 1:
                if (ySnap + (ship.size * SQUARE_SIZE) <= maxY) {
                    return true;
                }
                break;
            case 2:
                if (xSnap - (ship.size * SQUARE_SIZE) >= 0) {
                    return true;
                }
                break;
            case 3:
                if (ySnap - (ship.size * SQUARE_SIZE) >= 0) {
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
    let clickX = event.pageX - CANVAS_LEFT;
    let clickY = event.pageY - CANVAS_RIGHT;
    for (let i = 0; i < state.playerState.ships.length; i++) {
        let ship = state.playerState.ships[i];
        if (ship.heading === 0) {
            if (clickX >= ship.drawingX && clickX <= (ship.drawingX + (ship.size * SQUARE_SIZE))) {
                if (clickY >= ship.drawingY && clickY <= (ship.drawingY + SQUARE_SIZE)) {
                    return ship;
                }
            }
        } else if (ship.heading === 1) {
            if (clickX >= ship.drawingX && clickX <= ship.drawingX + SQUARE_SIZE) {
                if (clickY >= ship.drawingY && clickY <= ship.drawingY + (ship.size * SQUARE_SIZE)) {
                    return ship;
                }
            }
        } else if (ship.heading === 2) {
            if (clickX <= ship.drawingX && clickX >= (ship.drawingX - (ship.size * SQUARE_SIZE))) {
                if (clickY >= ship.drawingY && clickY <= (ship.drawingY + SQUARE_SIZE)) {
                    return ship;
                }
            }
        } else {
            if (clickX >= ship.drawingX && clickX <= ship.drawingX + SQUARE_SIZE) {
                if (clickY <= ship.drawingY && clickY >= ship.drawingY - (ship.size * SQUARE_SIZE)) {
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
            drawingContext.fillText(currentMessage[i], (SQUARE_SIZE * state.squareCount) + 10, BOTTOM_GRID_TOP + ((2 + (i + 1)) * SQUARE_SIZE));
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
            drawShip(state.playerState.ships[idx], 0, drawingContext);
        }
        if (state.mode !== 'placement' && state.observationState !== undefined) {
            if (state.observationState.length > 0) {
                for (let idx = 0; idx < state.observationState[0].ships.length; idx++) {
                    drawShip(state.observationState[0].ships[idx], 0, drawingContext);
                }
            }
            if (state.observationState.length > 1) {
                for (let idx = 0; idx < state.observationState[1].ships.length; idx++) {
                    drawShip(state.observationState[1].ships[idx], BOTTOM_GRID_TOP, drawingContext);
                }
            }
        }
    }
}

/**
 * Draws a single ship onto the ship grid (top grid).
 * @param ship
 * @param drawingContext
 */
function drawShip(ship, offsetY, drawingContext) {
    let shipY = ship.drawingY;
    let shipX = ship.drawingX;
    if (state.mode !== 'placement') {
        shipY = toDrawingCoordinate(ship.y, offsetY);
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
            centerX = shipX + SQUARE_SIZE;
            centerY = shipY;
            break;
        case 2:
            centerX = shipX + SQUARE_SIZE;
            centerY = shipY + SQUARE_SIZE;
            break;
        case 3:
            centerX = shipX;
            centerY = shipY + SQUARE_SIZE;
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
            drawingContext.fillRect(x + 2, y + 2, SQUARE_SIZE - 4, SQUARE_SIZE - 4);
            drawingContext.font = "11px Arial";
            drawingContext.fillStyle = "black";
            let val = Math.floor((state.turnNumber - shot.turnNumber) / 2);
            let hOffset = x + 8;
            if (val >= 10) {
                hOffset = x + 4;
            }
            if (val >= 100) {
                hOffset = x + 2;
                drawingContext.font = "8px Arial";
            }
            drawingContext.fillText("" + val, hOffset, y + 14)
            ;
        }
    }
}

/**
 * Renders ship "intel" (results of using a drone) to the players shot grid if present. Intel fades with time.
 * @param drawingContext
 */
function drawIntel(drawingContext) {
    if (state.playerState == null || state.playerState.intel === undefined || state.playerState.intel.length === 0) {
        return;
    }
    for (let i = 0; i < state.playerState.intel.length; i++) {
        let shot = state.playerState.intel[i];
        let color = 'MintCream';
        if (shot.isHit) {
            color = 'red';
        }
        let age = Math.floor((state.turnNumber - shot.turnNumber) / 2);
        if (age <= 3) {
            drawingContext.globalAlpha = Math.max(0.8 - (ALPHA_FACTOR * age), 0.2);
            drawingContext.fillStyle = color;
            let x = toDrawingCoordinate(shot.x, 0);
            let y = toDrawingCoordinate(shot.y, BOTTOM_GRID_TOP);
            drawingContext.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
        }

    }
    //reset alpha
    drawingContext.globalAlpha = 1;
}

/**
 * Draws the hits onto the top (ship) grid. Hits represent which of the player's ships have been hit so far.
 * @param drawingContext
 */
function drawHits(drawingContext) {
    if (state.playerState != null) {
        drawHitsOnShips(state.playerState.ships, 0, drawingContext);
    }
    if (state.observationState !== undefined) {
        if (state.observationState.length > 0) {
            drawHitsOnShips(state.observationState[0].ships, 0, drawingContext);
        }
        if (state.observationState.length > 1) {
            drawHitsOnShips(state.observationState[1].ships, BOTTOM_GRID_TOP, drawingContext);
        }
    }
}

/**
 * Draws the "hits" on a ship as red squares overlaid on top of the ship image. The yOffset is passed in so this
 * method can draw hits on either the top or bottom grid.
 * @param shipList
 * @param yOffset
 * @param drawingContext
 */
function drawHitsOnShips(shipList, yOffset, drawingContext) {
    if (shipList == null) {
        return;
    }
    for (let i = 0; i < shipList.length; i++) {
        let ship = shipList[i];

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
                drawingContext.fillRect(toDrawingCoordinate(x, 0) + (SQUARE_SIZE / 4), toDrawingCoordinate(y, yOffset) + (SQUARE_SIZE / 4), SQUARE_SIZE / 2, SQUARE_SIZE / 2);
            }
        }
    }
}

/**
 * Draws both ship grids.
 * @param drawingContext
 */
function drawBoard(drawingContext) {
    drawGrid(0, SQUARE_SIZE, state.squareCount, drawingContext);
    drawGrid(BOTTOM_GRID_TOP, SQUARE_SIZE, state.squareCount, drawingContext);
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
    return ((gridCoord - 1) * SQUARE_SIZE) + offset;
}


/**
 * Gets the selected ordinance from the control.
 * @returns {string|null}
 */
function getSelectedOrdinance() {
    let radio = document.getElementsByName("ordinance");
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked) {
            return radio[i].value.toLowerCase();
        }
    }
    return null;
}


/**
 * Updates the ordinance selector based on the player state. Ordinance that has been depleted is disabled so it can no
 * longer be selected.
 * @param playerState
 */
function updateOrdinance(playerState) {
    let radio = document.getElementsByName("ordinance");
    if (playerState != null && playerState.depletedOrdinance !== undefined && playerState.depletedOrdinance.length > 0) {
        for (let i = 0; i < radio.length; i++) {
            for (let j = 0; j < playerState.depletedOrdinance.length; j++) {
                if (radio[i].value.toLowerCase() === "shell") {
                    radio[i].checked = true;
                }
                if (radio[i].value.toLowerCase() === playerState.depletedOrdinance[j].toLowerCase()) {
                    radio[i].disabled = true;
                }
            }
        }
    } else {
        // when there is no state, reset things to the default
        for (let i = 0; i < radio.length; i++) {
            if (radio[i].value.toLowerCase() === "shell") {
                radio[i].checked = true;
            }
            radio[i].disabled = false;
        }
    }
}