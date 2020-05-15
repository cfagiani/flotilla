let assert = require('assert');
let Ship = require('../server/ship');

describe('Ship', function () {
    describe('#isHit', function () {
        it('should return True only if shot coordinates are in ship', function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 0;
            assert.strictEqual(ship.isHit(1, 0, true), true);
        });
        it('should return false if shot coordinates are not in ship', function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 0;
            assert.strictEqual(ship.isHit(ship.size + 2, 0, true), false);
        });
        it('should consider heading when determining if hit is true', function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 1;
            assert.strictEqual(ship.isHit(1, 0, true), false);
            assert.strictEqual(ship.isHit(0, 1, true), true);

            ship = new Ship("test", 3, 2, null);
            ship.x = 5;
            ship.y = 5;
            ship.heading = 2;
            assert.strictEqual(ship.isHit(5, 6, true), false);
            assert.strictEqual(ship.isHit(4, 5, true), true);

            ship = new Ship("test", 3, 2, null);
            ship.x = 5;
            ship.y = 5;
            ship.heading = 3;
            assert.strictEqual(ship.isHit(5, 6, true), false);
            assert.strictEqual(ship.isHit(5, 4, true), true);

        });
        it("should update the ship's hit array if the markHit flag is true", function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 0;
            ship.isHit(1, 0, true);
            ship.isHit(5, 5, true);
            assert.strictEqual(ship.hits[1], 1);
            assert.strictEqual(ship.hits[0], 0);
            assert.strictEqual(ship.hits[2], 0);
        });
        it("should not update the ship's hit array if the markHit flag is false", function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 0;
            ship.isHit(1, 0, false);
            assert.strictEqual(ship.hits[1], 0);
        });
    });
    describe('#advance', function () {
        it('should advance position by speed', function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 0;
            assert.strictEqual(ship.x, 0);
            assert.strictEqual(ship.y, 0);
            ship.advance(10, 10);
            assert.strictEqual(ship.x, ship.speed);
            assert.strictEqual(ship.y, 0);
        });
        it('should advance in the direction of heading', function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 1;
            assert.strictEqual(ship.x, 0);
            assert.strictEqual(ship.y, 0);
            ship.advance(10, 10);
            assert.strictEqual(ship.x, 0);
            assert.strictEqual(ship.y, ship.speed);
        });
        it('should not advance if sunk', function () {
            let ship = new Ship("test", 3, 2, null);
            ship.x = 0;
            ship.y = 0;
            ship.heading = 1;
            assert.strictEqual(ship.x, 0);
            assert.strictEqual(ship.y, 0);
            for (let i = 0; i < ship.size; i++) {
                ship.hits[i] = 1;
            }
            ship.advance(10, 10);
            assert.strictEqual(ship.x, 0);
            assert.strictEqual(ship.y, 0);
        });
        it('should reverse direction if at the end and not advance', function () {
            let ship = new Ship("test", 3, 2, null);
            let bound = 5;
            ship.x = bound;
            ship.y = 0;
            ship.heading = 0;
            ship.advance(bound, 10);
            assert.strictEqual(ship.heading, 2);
        });
        it('should not move on the same turn as reversing direction', function () {
            let ship = new Ship("test", 3, 2, null);
            let bound = 5;
            ship.x = bound;
            ship.y = 0;
            ship.heading = 0;
            ship.advance(bound, 10);
            assert.strictEqual(ship.x, bound);
        });
        it('after reversing direction should go advance in the opposite way', function () {
            let ship = new Ship("test", 3, 1, null);
            let bound = 5;
            ship.x = bound;
            ship.y = 0;
            ship.heading = 0;
            ship.advance(bound, 10);
            ship.advance(bound, 10);
            assert.strictEqual(ship.x, bound - ship.speed);
        });

    });
    describe('#isSunk', function () {
        it('should return true if all positions are hit', function () {
            let ship = new Ship("test", 3, 2, null);
            for (let i = 0; i < ship.size; i++) {
                ship.hits[i] = 1;
            }
            assert.strictEqual(ship.isSunk(), true);
        });
        it('should return false if not all positions are hit', function () {
            let ship = new Ship("test", 3, 2, null);
            for (let i = 0; i < ship.size - 1; i++) {
                ship.hits[i] = 1;
            }
            assert.strictEqual(ship.isSunk(), false);
        });
    });
    describe('#getState', function () {
        it('should return all required fields', function () {
            let ship = new Ship('test', 3, 2, 'testImg');
            let state = ship.getState();
            assert.strictEqual(state.x !== undefined, true);
            assert.strictEqual(state.y !== undefined, true);
            assert.strictEqual(state.heading !== undefined, true);
            assert.strictEqual(state.hits !== undefined, true);
            assert.strictEqual(state.speed === ship.speed, true);
            assert.strictEqual(state.size === ship.size, true);
            assert.strictEqual(state.image === ship.image, true);
        });
    });
});