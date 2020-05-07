let express = require('express');
let app = express();
let serv = require('http').Server(app);
const Game = require('./server/game');

const game = new Game();

let squareCount = 14;

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

    game.addPlayer(socket);

    socket.on('disconnect', function () {
        delete ALL_SOCKETS[socket.id];
        game.removePlayer(socket.id);
    });

    socket.on('sendMsgToServer', function (data) {
        let name = (game.getPlayer(socket.id).getUsername());
        for (let i in ALL_SOCKETS) {
            ALL_SOCKETS[i].emit('addToChat', name + ": " + data);
        }
    });
    socket.on('ready', function (data) {
        console.log(data);
    });


});