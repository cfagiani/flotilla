let express = require('express');
let app = express();
let serv = require('http').Server(app);
const Game = require('./server/game');

const game = new Game();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static('public'));


serv.listen(2000);
console.log("Server started.");

const ALL_SOCKETS = {};


let io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    ALL_SOCKETS[socket.id] = socket;

    let player = game.addPlayer(socket);
    let name = "User " + player.getPlayerNum();
    broadcastChat(name + " joined");

    socket.on('disconnect', function () {
        let name = "User " + game.getPlayer(socket.id).getPlayerNum();
        broadcastChat(name + " left");
        delete ALL_SOCKETS[socket.id];
        game.removePlayer(socket.id);
    });

    socket.on('sendMsgToServer', function (data) {
        let name = "User " + game.getPlayer(socket.id).getPlayerNum();
        broadcastChat(name + ": " + data);

    });
    socket.on('ready', function (data) {
        let player = game.getPlayer(socket.id);
        player.setReady(data.ships, true);
        broadcastChat("User " + player.getPlayerNum() + " is ready.");
        if (game.getReadyCount() === 2) {
            game.mode = 'play';
            broadcastState();
        }
    });

    socket.on('takeTurn', function (data) {
        result = game.recordTurn(data.playerId, data.x, data.y, data.ordinance.toLowerCase());
        if (result['shooter'] !== undefined) {
            let message = 'User ' + result['shooter'] + ' fired a ' + data.ordinance + ' at ' + data.x + ',' + data.y + ' ' + result['message'];
            broadcastChat(message);
        }
        broadcastState();
    });
});

function broadcastChat(message) {
    for (let i in ALL_SOCKETS) {
        ALL_SOCKETS[i].emit('addToChat', message);
    }
}

function broadcastState() {
    for (let i in ALL_SOCKETS) {
        ALL_SOCKETS[i].emit('stateUpdate', game.getState(ALL_SOCKETS[i].id));
    }
}