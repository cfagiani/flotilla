/**
 * This class represents this ship model. Ships track their own position, size, speed and hits.
 */
class Ship {
    constructor(name, size, speed, image) {
        this.name = name;
        this.size = size;
        this.speed = speed;
        this.image = image;
        this.hits = [];
        this.x = -1;
        this.y = -1;
        this.heading = 0;
        for (let i = 0; i < size; i++) {
            this.hits[i] = 0;
        }
    }

    getName() {
        return this.name;
    }

    /**
     * Returns true if this ship has been sunk (all positions hit).
     * @returns {boolean}
     */
    isSunk() {
        for (let i = 0; i < this.hits.length; i++) {
            if (this.hits[i] === 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Advances this ship according to its current position, heading, and speed.
     * @param maxX
     * @param maxY
     */
    advance(maxX, maxY) {
        if (this.isSunk()) {
            return;
        }
        switch (this.heading) {
            case 0:
                if (this.x + this.size <= maxX) {
                    this.x = Math.min(maxX - this.size + 1, this.x + this.speed);
                } else {
                    this.heading = 2;
                }
                break;
            case 1:
                if (this.y + this.size <= maxY) {
                    this.y = Math.min(maxY - this.size + 1, this.y + this.speed);
                } else {
                    this.heading = 3;
                }
                break;
            case 2:
                if (this.x - this.size > 0) {
                    this.x = Math.max(this.size, this.x - this.speed);
                } else {
                    this.heading = 0;
                }
                break;
            case 3:
                if (this.y - this.size > 0) {
                    this.y = Math.max(this.size, this.y - this.speed);
                } else {
                    this.heading = 1;
                }
        }
    }

    /**
     * Returns the state object representing this ship.
     * @returns {{hits: [], image: *, size: *, heading: number, x: number, name: *, y: number, speed: *}}
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            name: this.name,
            heading: this.heading,
            hits: this.hits,
            speed: this.speed,
            size: this.size,
            image: this.image
        }
    }

    /**
     * Returns true if this ship is Hit by a shot at the grid coordinates passed in. A hit is only a hit if that position
     * within the ship has not yet been hit previously.
     * @param x
     * @param y
     * @param markHit
     * @returns {boolean}
     */
    isHit(x, y, markHit) {
        let minX = this.x;
        let minY = this.y;
        let maxX = this.x;
        let maxY = this.y;
        let hitIndex = -1;

        switch (this.heading) {
            case 0:
                maxX = this.x + this.size;
                hitIndex = x - minX;
                break
            case 1:
                maxY = this.y + this.size;
                hitIndex = y - minY;
                break;
            case 2:
                minX = this.x - this.size;
                hitIndex = maxX - x;
                break;
            case 3:
                minY = this.y - this.size;
                hitIndex = maxY - x;
                break;
        }

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            //it was a hit,now check the hits array
            if (this.hits[hitIndex] === 0) {
                if (markHit) {
                    this.hits[hitIndex] = 1;
                }
                return true;
            }
        }
    }
}

module.exports = Ship;