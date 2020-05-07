const Player = require('./player')
const SQUARE_COUNT = 14;

class Game {
    constructor() {
        this.sockets = {};
        this.players = {};
        this.turnNumber = 1;
        this.mode = "placement";
    }

    addPlayer(socket) {
        let count = Object.keys(this.sockets).length;
        this.sockets[socket.id] = socket;
        this.players[socket.id] = new Player(socket.id, "User " + (count + 1), count < 2 ? 'player' : 'observer');
        socket.emit("stateUpdate", this.getState(socket.id));
    }

    removePlayer(id) {
        let sock = this.sockets[id];
        if (sock !== undefined) {
            delete this.sockets[id];
            delete this.players[id];
        }
    }

    getState(id) {
        return {
            turnNumber: this.turnNumber,
            mode: this.mode,
            squareCount: SQUARE_COUNT,
            playerState: this.players[id].getState()
        }
    }

    getPlayer(id) {
        return this.players[id];
    }
}

module.exports = Game;