let squareSize = 20;
let squareCount = 14;


init();

function init() {
    setupBoard();
    let socket = io();
    setupChat(socket);

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
    drawBoard();
}



function drawBoard() {
    let canvasElement = document.getElementById("gameCanvas");
    let drawingContext = canvasElement.getContext("2d");

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


