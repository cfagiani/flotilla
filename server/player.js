class Player {
    constructor(id, username) {
        this.id = id;
        this.username = username;
        this.ships = [];
        this.shots = [];
        this.ships.push(createShip("carrier", 5, 1));
        this.ships.push(createShip("destroyer", 4, 2));
        this.ships.push(createShip("cruiser", 3, 3));
        this.ships.push(createShip("submarine", 3, 2));
        this.ships.push(createShip("corvette", 2, 3));
    }

    getState() {
        return {ships: this.ships, shots: this.shots};
    }
}

function createShip(name, size, speed) {
    let hits = [];
    for (let i = 0; i < size; i++) {
        hits[i] = 0;
    }
    return {x: -1, y: -1, name: name, headingX: 1, headingY: 0, hits: hits, speed: speed, size: size}
}

module.exports = Player;