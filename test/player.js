let assert = require('assert');
let Player = require('../server/player');
let Ship = require('../server/ship');
let Shot = require('../server/shot');

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
            let player = new Player(1, null, 1, 'player');
            player.ships[0].x = 1;
            player.ships[0].y = 1;
            let shot = player.shotAt(1, 1, false, 1, 10);
            assert.strictEqual(shot.isHit, true);
            for (let i = 0; i < player.ships[0].size; i++) {
                assert.strictEqual(player.ships[0].hits[i], 0);
            }
        });
        it('should set sinking if shot sinks a ship', function () {
            let player = new Player(1, null, 1, 'player');
            player.ships[4].x = 1;
            player.ships[4].y = 1;
            let shot = player.shotAt(1, 1, true, 1, 10);
            assert.strictEqual(shot.isHit, true);
            assert.strictEqual(shot.sunk.length, 0);

            shot = player.shotAt(2, 1, true, 1, 10);
            assert.strictEqual(shot.isHit, true);
            assert.strictEqual(shot.sunk.length, 1);
            assert.strictEqual(shot.sunk[0], player.ships[4].name);

        });
        it('should return a shot object if shot misses', function () {
            let player = new Player(1, null, 1, 'player');
            player.ships[0].x = 1;
            player.ships[0].y = 1;
            let shot = player.shotAt(9, 1, false, 1, 10);
            assert.strictEqual(shot.isHit, false);

        });
        it('should return shot object with hit flag if it was a hit', function () {
            let player = new Player(1, null, 1, 'player');
            player.ships[0].x = 1;
            player.ships[0].y = 1;
            let shot = player.shotAt(1, 1, false, 1, 10);
            assert.strictEqual(shot.isHit, true);
        });
    });
    describe('#setReady', function () {
        it('should update the coordinates and heading of all ships', function () {
            let player = new Player(1, null, 1, 'player');
            let updatedShips = [];
            let fakeVal = 999;
            let coordX = 3;
            let coordY = 2;
            let heading = 1;
            for (let i = 0; i < player.ships.length; i++) {
                let s = new Ship(player.ships[i].name, fakeVal, fakeVal, 'none');
                s.x = coordX;
                s.y = coordY;
                s.heading = heading;
                updatedShips.push(s);
            }
            player.setReady(updatedShips, true);
            for (let i = 0; i < player.ships.length; i++) {
                assert.strictEqual(player.ships[i].x, coordX);
                assert.strictEqual(player.ships[i].y, coordY);
                assert.strictEqual(player.ships[i].heading, heading);
                assert.notStrictEqual(player.ships[i].size, fakeVal);
                assert.notStrictEqual(player.ships[i].heading, fakeVal);
                assert.notStrictEqual(player.ships[i].speed, fakeVal);
            }
        });
    });
    describe('#setIntel', function () {
        it('should append intel', function () {
            let player = new Player(1, null, 1, 'player');

            let intelObj = [new Shot(1, 1, true, 1)];
            player.setIntel(intelObj);
            assert.strictEqual(player.intel.length, 1);
            player.setIntel(intelObj);
            assert.strictEqual(player.intel.length, 2);

        });
    });
    describe('#isTurn', function(){
        it("should return true only if it would be this player's turn on the turn number passed in", function(){
            let p1 = new Player(1,null,1,'player');
            let p2 = new Player(2,null,2,'player');
            assert.strictEqual(p1.isTurn(1), true);
            assert.strictEqual(p2.isTurn(1), false);
            assert.strictEqual(p1.isTurn(2), false);
            assert.strictEqual(p2.isTurn(2), true);
            assert.strictEqual(p1.isTurn(3), true);
            assert.strictEqual(p2.isTurn(3), false);


        });
    });
});



