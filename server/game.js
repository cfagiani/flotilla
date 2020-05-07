const Player = require('./player')
const SQUARE_COUNT = 14;

class Game {
    constructor() {
        this.sockets = {};
        this.participants = {};
        this.turnNumber = 1;
        this.mode = "placement";
        this.players = [null, null];
    }

    addPlayer(socket) {
        let count = Object.keys(this.sockets).length;
        this.sockets[socket.id] = socket;
        this.participants[socket.id] = new Player(socket.id, count + 1, count < 2 ? 'player' : 'observer');
        if (count < 2) {
            this.players[count] = this.participants[socket.id];
        }
        socket.emit("stateUpdate", this.getState(socket.id));
    }

    removePlayer(id) {
        let sock = this.sockets[id];
        if (sock !== undefined) {
            delete this.sockets[id];
            let player = this.participants[id];
            if (player !== undefined) {
                if (player.playerNum <= 2) {
                    this.players[player.playerNum - 1] = null;
                }
                delete this.participants[id];
            }
        }
    }

    getState(id) {
        return {
            turnNumber: this.turnNumber,
            mode: this.mode,
            squareCount: SQUARE_COUNT,
            playerState: this.participants[id].getState(this.turnNumber)
        }
    }

    getPlayer(id) {
        return this.participants[id];
    }

    getReadyCount() {
        let count = 0;
        for (let i in this.participants) {
            if (this.participants[i].isReady()) {
                count++;
            }
        }
        return count;
    }

    recordTurn(playerId, x, y, ordinance) {
        let shooter = this.participants[playerId];
        if (shooter !== undefined) {
            let otherPlayer = null;
            if (shooter.playerNum === 1) {
                otherPlayer = this.players[1];
            } else {
                otherPlayer = this.players[0];
            }
            shooter.addShot(otherPlayer.shotAt(x, y, this.turnNumber, SQUARE_COUNT));
            this.turnNumber++;
        }
    }
}

module.exports = Game;