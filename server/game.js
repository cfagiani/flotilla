const Player = require('./player')
const SQUARE_COUNT = 14;

class Game {
    constructor() {
        this.sockets = {};
        this.players = {};
        this.turnNumber = 1;
        this.mode = "placement";
    }

    addPlayer(socket, username) {
        this.sockets[socket.id] = socket;
        this.players[socket.id] = new Player(socket.id, username);
        socket.emit("stateUpdate", this.getState(socket.id));
    }

    getState(id) {
        return {
            turnNumber: this.turnNumber,
            mode: this.mode,
            squareCount: SQUARE_COUNT,
            playerState: this.players[id].getState()
        }
    }
}

module.exports = Game;