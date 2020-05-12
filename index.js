let express = require('express');
let app = express();
let serv = require('http').Server(app);
const Game = require('./server/game');

const GAME_MAP = {
    'walnut': new Game(), 'spoors': new Game(), 'desist': new Game(),
    'melons': new Game(), 'bucket': new Game(), 'coffee': new Game()
};


app.get('/', function (req, res) {
    let keyArray = Object.keys(GAME_MAP);
    let selectedRoom = keyArray[Math.floor(Math.random() * keyArray.length)];
    res.redirect('/room/' + selectedRoom);

});

app.get('/room/:room', function (req, res) {
    let game = GAME_MAP[req.params['room']]
    if (game === undefined) {
        res.status(404);
        res.sendFile(__dirname + '/public/error.html');
    }
    res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'));


serv.listen(2000);
console.log("Server started.");

const ALL_SOCKETS = {};


let io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    socket.on('join', function (data) {
        let parts = data.split("/");
        let room = parts[parts.length - 1];
        let game = GAME_MAP[room];

        let player = game.addPlayer(socket);
        let name = "User " + player.getPlayerNum();
        game.broadcastChat(name + " joined");
        socket.on('disconnect', function () {
            let name = "User " + game.getPlayer(socket.id).getPlayerNum();
            game.broadcastChat(name + " left");
            delete ALL_SOCKETS[socket.id];
            let wasPlayer = game.removePlayer(socket.id);
            if (wasPlayer) {
                game.broadcastChat('Only 1 player. Game resetting');
                game.mode = 'placement';
                game.reset();
            }
        });

        socket.on('sendMsgToServer', function (data) {
            let name = "User " + game.getPlayer(socket.id).getPlayerNum();
            game.broadcastChat(name + ": " + data);

        });
        socket.on('ready', function (data) {
            let player = game.getPlayer(socket.id);
            player.setReady(data.ships, true);
            game.broadcastChat("User " + player.getPlayerNum() + " is ready.");
            if (game.getReadyCount() === 2) {
                game.mode = 'play';
                game.broadcastState();
            }
        });

        socket.on('takeTurn', function (data) {
            result = game.recordTurn(data.playerId, data.x, data.y, data.ordinance.toLowerCase());
            if (result['shooter'] !== undefined) {
                let message = 'User ' + result['shooter'] + ' fired a ' + data.ordinance + ' at ' + data.x + ',' + data.y + result['message'];
                game.broadcastChat(message);
            }
            game.broadcastState();
        });

    });


});
