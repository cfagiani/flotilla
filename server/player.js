const Ship = require('./ship')
const Shot = require('./shot')

class Player {
    constructor(id, playerNum, role) {
        this.id = id;
        this.playerNum = playerNum;
        this.role = role;
        this.ready = false;
        this.ships = [];
        this.shots = [];
        if (this.role !== 'observer') {
            this.ships.push(new Ship("carrier", 5, 1, "carrier.png"));
            this.ships.push(new Ship("destroyer", 4, 2, "destroyer.png"));
            this.ships.push(new Ship("cruiser", 3, 3, "cruiser.png"));
            this.ships.push(new Ship("submarine", 3, 2, "sub.png"));
            this.ships.push(new Ship("corvette", 2, 3, "corvette.png"));
        }
    }

    getState(turnNumber) {
        return {
            id: this.id,
            ships: this.ships,
            shots: this.shots,
            num: this.playerNum,
            isTurn: this.playerNum === 1 ? turnNumber % 2 === 1 : turnNumber % 2 === 0
        };
    }

    getPlayerNum() {
        return this.playerNum;
    }

    shotAt(x, y, turnNumber) {
        let shot = new Shot(x, y, false, turnNumber);
        for (let i = 0; i < this.ships.length; i++) {
            let ship = this.ships[i];
            // check if the shot is within the ship
            if (ship.isHit(x, y)) {
                shot.setHit();
            }
        }
        return shot;
    }

    addShot(shot) {
        this.shots.push(shot);
    }

    setReady(ships, isReady) {
        // update the x,y position of the ships only; ignore other fields so clients can't manipulate speed/hits
        for (let i = 0; i < ships.length; i++) {
            for (let j = 0; j < this.ships.length; j++) {
                if (ships[i].name === this.ships[j].name) {
                    this.ships[j].x = ships[i].x;
                    this.ships[j].drawingX = ships[i].drawingX;
                    this.ships[j].y = ships[i].y;
                    this.ships[j].drawingY = ships[i].drawingY;
                    break;
                }
            }
        }
        this.ready = isReady;
    }

    isReady() {
        return this.ready;
    }
}


module.exports = Player;