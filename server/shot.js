class Shot {

    constructor(x, y, isHit, turn) {
        this.x = x;
        this.y = y;
        this.turnNumber = turn;
        this.isHit = isHit;
    }

    setHit() {
        this.isHit = true;
    }
}

module.exports = Shot;