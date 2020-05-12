/**
 * This class represents a shot that was taken by a player. The shot includes the turn on which it occurred so the
 * front-end can display the age of the shot.
 */
class Shot {

    constructor(x, y, isHit, turn) {
        this.x = x;
        this.y = y;
        this.turnNumber = turn;
        this.isHit = isHit;
        this.sunk = []
    }

    setHit() {
        this.isHit = true;
    }

    addSinking(ship) {
        this.sunk.push(ship);
    }
}

module.exports = Shot;