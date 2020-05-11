const Ship = require('./ship')
const Shot = require('./shot')

/**
 * Model class representing a player. A player's state consists of the position and state of their ships as well as the
 * list of their shots.
 */
class Player {
    constructor(id,socket, playerNum, role) {
        this.id = id;
        this.socket = socket;
        this.playerNum = playerNum;
        this.role = role;
        this.ready = false;
        this.depletedOrdinance = [];
        this.ships = [];
        this.intel = [];
        this.shots = [];
        if (this.role !== 'observer') {
            this.ships.push(new Ship("carrier", 5, 1, "carrier.png"));
            this.ships.push(new Ship("destroyer", 4, 2, "destroyer.png"));
            this.ships.push(new Ship("cruiser", 3, 3, "cruiser.png"));
            this.ships.push(new Ship("submarine", 3, 2, "sub.png"));
            this.ships.push(new Ship("corvette", 2, 3, "corvette.png"));
        }
    }

    /**
     * Returns this player's role as a string (either 'player' or 'observer')
     * @returns
     */
    getRole() {
        return this.role;
    }

    /**
     * Returns true if the player has at least 1 ship that has not yet been sunk.
     * @returns {boolean}
     */
    hasLiveShips() {
        for (let i = 0; i < this.ships.length; i++) {
            if (!this.ships[i].isSunk()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the state object for this player.
     * @param turnNumber
     * @returns {{isWinner: boolean, ships: [], num: *, id: *, shots: [], isTurn: boolean}}
     */
    getState(turnNumber) {
        return {
            id: this.id,
            ships: this.ships,
            shots: this.shots,
            num: this.playerNum,
            intel: this.intel,
            depletedOrdinance: this.depletedOrdinance,
            isTurn: this.playerNum === 1 ? turnNumber % 2 === 1 : turnNumber % 2 === 0,
            isWinner: this.hasLiveShips()
        };
    }

    /**
     * Gets the playerNumber for the player. For observers, this is undefined.
     * @returns {*}
     */
    getPlayerNum() {
        return this.playerNum;
    }

    /**
     * Processes a shot at the coordinates passed in. This should be called on the 'target' of a shot. If the shot
     * hit a ship, the hit will be recorded in the corresponding ship objects.
     * @param x
     * @param y
     * @param liveAmmo
     * @param turnNumber
     * @param squareCount
     * @returns {Shot}
     */
    shotAt(x, y, liveAmmo, turnNumber, squareCount) {
        if (x <= 0 || x > squareCount || y <= 0 || y > squareCount) {
            // the shot is out of bounds. Do nothing.
            return null;
        }
        let shot = new Shot(x, y, false, turnNumber);
        for (let i = 0; i < this.ships.length; i++) {
            let ship = this.ships[i];
            // check if the shot is within the ship
            if (ship.isHit(x, y, liveAmmo)) {
                shot.setHit();
            }
        }
        return shot;
    }

    /**
     * Advances all the ships (if they have not yet been sunk) according to their current position and speed.
     * @param squareCount
     */
    advanceShips(squareCount) {
        for (let i = 0; i < this.ships.length; i++) {
            this.ships[i].advance(squareCount, squareCount);
        }
    }

    /**
     * Adds a shot to this player's shot collection. This should be called on the "source" of a turn (the shooter).
     * @param shot
     * @param ordinance
     */
    addShot(shot, ordinance) {
        if (ordinance === "drone" || ordinance === "missile") {
            this.depletedOrdinance.push(ordinance);
        }
        this.shots.push(shot);
    }

    /**
     * Sets this player to the 'ready' state by updating the ships collection with their initial grid positions and
     * headings.
     * @param ships
     * @param isReady
     */
    setReady(ships, isReady) {
        // update the x,y position of the ships only; ignore other fields so clients can't manipulate speed/hits
        for (let i = 0; i < ships.length; i++) {
            for (let j = 0; j < this.ships.length; j++) {
                if (ships[i].name === this.ships[j].name) {
                    this.ships[j].x = ships[i].x;
                    this.ships[j].heading = ships[i].heading;
                    this.ships[j].y = ships[i].y;
                    break;
                }
            }
        }
        this.ready = isReady;
    }

    /**
     * Returns true if this player is in the ready state.
     * @returns {boolean}
     */
    isReady() {
        return this.ready;
    }

    setIntel(intel) {
        if (this.intel !== undefined && this.intel.length > 0) {
            this.depletedOrdinance.push('drone');
        }
        this.intel = intel;
    }
}


module.exports = Player;