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

    broadcastChat(message) {
        for (let id in this.participants) {
            this.participants[id].socket.emit('addToChat', message);
        }
    }

    broadcastState() {
        for (let id in this.participants) {
            this.participants[id].socket.emit('stateUpdate', this.getState(id));
        }
    }

    /**
     * Adds a player to the game. If this is among the first 2 players, they are added in the "player" otherwise they're
     * added as an observer. After adding the player, a stateUpdate event is emitted on the socket for the newly joined
     * player so the front-end can render the initial game state.
     * @param socket
     */
    addPlayer(socket) {
        let count = Object.keys(this.participants).length;
        let player = new Player(socket.id, socket, count + 1, count < 2 ? 'player' : 'observer');
        this.participants[socket.id] = player;
        if (count < 2) {
            this.players[count] = this.participants[socket.id];
        }
        socket.emit("stateUpdate", this.getState(socket.id));
        return player;
    }

    /**
     * Removes a player from the game.
     * @param id
     */
    removePlayer(id) {
        let player = this.participants[id];
        let wasPlayer = false;
        if (player !== undefined) {
            if (player.playerNum <= 2) {
                this.players[player.playerNum - 1] = null;
                wasPlayer = true;
            }
            delete this.participants[id];
        }
        return wasPlayer
    }

    /**
     * Resets the game state. If there are observers connected, two of them will become players.
     */
    reset() {
        this.mode = 'placement';
        this.players = [];
        let count = 0;
        for (let id in this.participants) {
            let oldPlayer = this.getPlayer(id);
            let player = new Player(id, oldPlayer.socket, count + 1, count < 2 ? 'player' : 'observer');
            this.participants[id] = player;
            if (count < 2) {
                this.players[count] = this.participants[id];
            }
            count++;
            player.socket.emit("stateUpdate", this.getState(id));
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

        let stateForPlayer = {
            turnNumber: this.turnNumber,
            mode: this.mode,
            squareCount: SQUARE_COUNT,
            playerState: this.participants[id].getState(this.turnNumber)
        }

        if (this.participants[id].getRole() === 'observer') {
            stateForPlayer['observationState'] = [];
            for (let i = 0; i < this.players.length; i++) {
                stateForPlayer['observationState'].push(this.players[i].getState(this.turnNumber));
            }
        }

        return stateForPlayer;
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
     * Returns number of participants in this game.
     * @returns {number}
     */
    getParticipantCount() {
        return Object.keys(this.participants).length;
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
        let result = {};
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
                return result;
            }
            result['shooter'] = shooter.getPlayerNum();
            switch (ordinance) {
                case 'missile':
                    let misses = 0;
                    let hits = 0;
                    let sinkings = []
                    for (let i = -1; i < 2; i++) {
                        for (let j = -1; j < 2; j++) {
                            let shot = otherPlayer.shotAt(x + i, y + j, true, this.turnNumber, SQUARE_COUNT);
                            if (shot != null) {
                                if (shot.isHit) {
                                    hits++;
                                    if (shot.sunk.length > 0) {
                                        sinkings = sinkings.concat(shot.sunk);
                                    }
                                } else {
                                    misses++;
                                }
                                // we get null back if the shot was out of bounds; don't push those to the history list
                                shooter.addShot(shot, ordinance);
                            }
                        }
                    }
                    result['message'] = ": " + hits + " hits and " + misses + " misses";
                    if (sinkings.length > 0) {
                        result['message'] = result['message'] + " Sunk " + sinkings.join(',');
                    }
                    otherPlayer.advanceShips(SQUARE_COUNT);
                    break;
                case 'drone':
                    let intel = [];
                    otherPlayer.advanceShips(SQUARE_COUNT);
                    for (let i = -2; i < 3; i++) {
                        for (let j = -2; j < 3; j++) {
                            let shot = otherPlayer.shotAt(x + i, y + j, false, this.turnNumber, SQUARE_COUNT)
                            if (shot != null) {
                                intel.push(shot);
                            }
                        }
                    }
                    result['message'] = '';
                    shooter.setIntel(intel);
                    break;
                case 'shell':
                    let shot = otherPlayer.shotAt(x, y, true, this.turnNumber, SQUARE_COUNT);
                    shooter.addShot(shot, ordinance);
                    result['message'] = shot.isHit ? ': hit' : ': miss';
                    if (shot.sunk.length > 0) {
                        result['message'] = result['message'] + " Sunk " + shot.sunk.join(',');
                    }
                    otherPlayer.advanceShips(SQUARE_COUNT);
                    break;
            }
            shooter.updateOrdinanceCounts(ordinance);
            this.turnNumber++;
        }
        return result;
    }
}

module.exports = Game;