let assert = require('assert');
let Player = require('../server/player');

describe('Player', function () {
    describe('#construcor', function () {
        it('should not populate ships for observers', function () {
            let player = new Player(1, null, 1, 'observer');
            assert.strictEqual(player.ships.length, 0);
        });
        it('should populate 5 ships for players', function () {
            let player = new Player(1, null, 1, 'player');
            assert.strictEqual(player.ships.length, 5);
        });
    });
    describe('#hasLiveShips', function () {
        it('should return true if at least 1 ship is not sunk', function () {
            let player = new Player(1, null, 1, 'player');
            assert.strictEqual(player.hasLiveShips(), true);
        });
        it('should return false for observers', function () {
            let player = new Player(1, null, 1, 'observer');
            assert.strictEqual(player.hasLiveShips(), false);
        });
        it('should return false if all ships are sunk', function () {
            let player = new Player(1, null, 1, 'observer');
            // mark everything as sunk
            for (let i = 0; i < player.ships.length; i++) {
                for (let j = 0; j < player.ships[i].hits.length; j++) {
                    player.ships[i].hits[j] = 1;
                }
            }
            assert.strictEqual(player.hasLiveShips(), false);
        });

    });
    describe('#advanceShips', function () {
        it('should advance the position of all ships', function () {
            let player = new Player(1, null, 1, 'player');
            for (let i = 0; i < player.ships.length; i++) {
                //set initial position
                player.ships[i].x = 0;
                player.ships[i].y = 0;
            }
            player.advanceShips(15);
            for (let i = 0; i < player.ships.length; i++) {
                assert.strictEqual(player.ships[i].x > 0, true);
            }
        });
    });

    describe('#shotAt', function () {
        it('should return null if one or more coordinate is out of bounds', function () {
            let player = new Player(1, null, 1, 'player');
            let shot = player.shotAt(200, 200, true, 1, 10);
            assert.strictEqual(shot, null);
            shot = player.shotAt(2, 200, true, 1, 10);
            assert.strictEqual(shot, null);
            shot = player.shotAt(11, 2, true, 1, 10);
            assert.strictEqual(shot, null);
        });
        it('should not update ships hit if not using live ammo', function () {
            //TODO: implement test
        });
        it('should set sinking if shot sinks a ship', function () {
            //TODO: implement test
        });
        it('should return a shot object if shot misses', function () {
            //TODO: implement test
        });
        it('should return shot object with hit flag if it was a hit', function () {
            //TODO: implement test
        });

    });
});



