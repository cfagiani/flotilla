var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static('public'));


serv.listen(2000);
console.log("Server started.");

const ALL_SOCKETS = {};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    ALL_SOCKETS[socket.id] = socket;
    //Player.onConnect(socket);

    socket.on('disconnect', function (socket) {
        delete ALL_SOCKETS[socket.id];
        //Player.onDisconnect(socket);
    })
    socket.on('sendMsgToServer', function (data) {
        let name = ("" + socket.id).slice(2, 7)
        for (let i in ALL_SOCKETS) {
            ALL_SOCKETS[i].emit('addToChat', name + ": " + data);
        }
    });


});