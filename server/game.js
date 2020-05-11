const Player = require('./player')
const SQUARE_COUNT = 14;

/**
 * This class represents the overall state of the game. It keeps track of the participants involved
 * (observers and players). A "Game" object should be constructed for each game "room" launched from the site.
 *
 */
class Game {
    constructor() {
        this.participants = {};
        this.turnNumber = 1;
        this.mode = "placement";
        this.players = [null, null];
    }

    /**
     * Adds a player to the game. If this is among the first 2 players, they are added in the "player" otherwise they're
     * added as an observer. After adding the player, a stateUpdate event is emitted on the socket for the newly joined
     * player so the front-end can render the initial game state.
     * @param socket
     */
    addPlayer(socket) {
        let count = Object.keys(this.participants).length;
        this.participants[socket.id] = new Player(socket.id, count + 1, count < 2 ? 'player' : 'observer');
        if (count < 2) {
            this.players[count] = this.participants[socket.id];
        }
        socket.emit("stateUpdate", this.getState(socket.id));
    }

    /**
     * Removes a player from the game.
     * @param id
     */
    removePlayer(id) {
        let player = this.participants[id];
        if (player !== undefined) {
            if (player.playerNum <= 2) {
                this.players[player.playerNum - 1] = null;
            }
            delete this.participants[id];
        }
    }

    /**
     * Gets the game state for a particular player. If the player is in the 'player' role, the state will only contain
     * their ships (so they can't cheat and look at the state of their opponent).
     * @param id
     * @returns json object containing the game state as visible to the player passed in.
     */
    getState(id) {
        // first check if the game mode should be "gameOver" or not
        for (let i in this.participants) {
            if (this.participants[i].getRole() === 'player' && !this.participants[i].hasLiveShips()) {
                this.mode = 'gameOver';
                break;
            }
        }

        return {
            turnNumber: this.turnNumber,
            mode: this.mode,
            squareCount: SQUARE_COUNT,
            playerState: this.participants[id].getState(this.turnNumber)
        }
    }

    /**
     * Returns the player object identified by the ID passed in.
     * @param id
     * @returns {*}
     */
    getPlayer(id) {
        return this.participants[id];
    }

    /**
     * Returns the number of players that have reported "ready". Once both players are ready, the game can begin.
     * @returns {number}
     */
    getReadyCount() {
        let count = 0;
        for (let i in this.participants) {
            if (this.participants[i].isReady()) {
                count++;
            }
        }
        return count;
    }

    /**
     * Records a turn for a player. This consists of shooting ordinance at grid coordinates and incrementing the turn
     * number.
     * @param playerId
     * @param x
     * @param y
     * @param ordinance
     */
    recordTurn(playerId, x, y, ordinance) {
        let shooter = this.participants[playerId];
        if (shooter !== undefined) {
            let otherPlayer = null;
            if (shooter.playerNum === 1) {
                otherPlayer = this.players[1];
            } else {
                otherPlayer = this.players[0];
            }
            // make sure the player isn't trying to use ordinance that is already depleted.
            if (shooter.depletedOrdinance.includes(ordinance)) {
                console.log('Detected cheating attempt. Player ' + shooter.id +
                    ' tried to re-use depleted ordinance ' + ordinance);
                return;
            }
            switch (ordinance) {
                case 'missile':
                    for (let i = -1; i < 2; i++) {
                        for (let j = -1; j < 2; j++) {
                            let shot = otherPlayer.shotAt(x + i, y + j, this.turnNumber, SQUARE_COUNT)
                            if (shot != null) {
                                // we get null back if the shot was out of bounds; don't push those to the history list
                                shooter.addShot(shot, ordinance);
                            }
                        }
                    }
                    break;
                case 'shell':
                    shooter.addShot(otherPlayer.shotAt(x, y, this.turnNumber, SQUARE_COUNT), ordinance);
                    break;
            }
            otherPlayer.advanceShips(SQUARE_COUNT);
            this.turnNumber++;
        }
    }
}

module.exports = Game;