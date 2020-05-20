let express = require('express');
let app = express();
let serv = require('http').Server(app);
const Game = require('./server/game');

const GAME_MAP = {
    'walnut': new Game(), 'spoors': new Game(), 'desist': new Game(),
    'melons': new Game(), 'bucket': new Game(), 'coffee': new Game()
};

// Set up routes
app.get('/', function (req, res) {
    res.redirect('/room/' + selectRoom());
});

app.get('/room/:room', function (req, res) {
    let game = GAME_MAP[req.params['room']]
    if (game === undefined) {
        res.status(404);
        res.sendFile(__dirname + '/public/error.html');
    }
    res.sendFile(__dirname + '/public/index.html');
});

// start the server and set up the websockets
app.use(express.static('public'));
serv.listen(2000);
console.log("Server started.");
let io = require('socket.io')(serv, {});

io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    socket.on('join', function (data) {
        let parts = data.split("/");
        let room = parts[parts.length - 1];
        let game = GAME_MAP[room];

        let player = game.addPlayer(socket);
        let name = "User " + player.getPlayerNum();
        game.broadcastChat(name + " joined", 'system');
        socket.on('disconnect', function () {
            let name = "User " + game.getPlayer(socket.id).getPlayerNum();
            game.broadcastChat(name + " left", 'system');
            let wasPlayer = game.removePlayer(socket.id);
            if (wasPlayer) {
                game.broadcastChat('Only 1 player. Game resetting', 'system');
                game.mode = 'placement';
                game.reset();
            }
        });

        socket.on('newgame', function (data) {
            game.reset();
        });

        socket.on('sendMsgToServer', function (data) {
            let name = "User " + game.getPlayer(socket.id).getPlayerNum();
            game.broadcastChat(name + ": " + data, 'user');

        });
        socket.on('ready', function (data) {
            let player = game.getPlayer(socket.id);
            player.setReady(data.ships, true);
            game.broadcastChat("User " + player.getPlayerNum() + " is ready.", 'system');
            if (game.getReadyCount() === 2) {
                game.mode = 'play';
                game.broadcastState();
            }
        });

        socket.on('takeTurn', function (data) {
            let result = game.recordTurn(data.playerId, data.x, data.y, data.ordinance.toLowerCase());
            if (result['shooter'] !== undefined) {
                let message = 'User ' + result['shooter'] + ' fired a ' + data.ordinance + ' at ' + data.x + ',' + data.y + result['message'];
                game.broadcastChat(message, 'turn');
            }
            game.broadcastState();
        });

    });
});

/**
 * Selects the game room to assign to a user using the following heuristics:
 * 1. place the user into a game with 1 other player
 * 2. place the user into an empty game
 * 3. randomly select a game
 */
function selectRoom() {

    let zeroPlayerRoom = null;
    // loop over all the rooms and find out how many players are there
    for (let room in GAME_MAP) {
        let count = GAME_MAP[room].getParticipantCount();
        // we found a game with a player waiting for an opponent. use that
        if (count === 1) {
            return room;
        } else if (count === 0) {
            zeroPlayerRoom = room;
        }
    }
    // if we are here, there are no rooms waiting for players so put the user in an empty game
    if (zeroPlayerRoom != null) {
        return zeroPlayerRoom;
    }
    // if we are here, all games have 2 players so just pick a room at random and put the user there as an observer
    let keyArray = Object.keys(GAME_MAP);
    let selectedRoom = keyArray[Math.floor(Math.random() * keyArray.length)];
    return selectedRoom;
}