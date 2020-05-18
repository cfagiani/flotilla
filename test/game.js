let assert = require('assert');
let Game = require('../server/game');
let MockSocket = require('./fixtures');

describe('Game', function () {
    describe('#constructor', function () {
        it('should start in placement mode', function () {
            let g = new Game();
            assert.strictEqual(g.mode, 'placement');
        });
        it('should start with null players', function () {
            let g = new Game();
            assert.strictEqual(g.players[0], null);
            assert.strictEqual(g.players[1], null);
        });
        it('should start on turn 1', function () {
            let g = new Game();
            assert.strictEqual(g.turnNumber, 1);
        });
    });
    describe('#addPlayer', function () {
        it('should add user as a player if game has fewer than 2 players', function () {
            let game = new Game();
            let player = game.addPlayer(new MockSocket());
            assert.strictEqual(player.role, 'player');
            player = game.addPlayer(new MockSocket());
            assert.strictEqual(player.role, 'player');
            assert.strictEqual(game.players.length, 2);
        });
        it('should emit a stateUpdate message', function () {
            let game = new Game();
            let sock = new MockSocket();
            game.addPlayer(sock);
            assert.strictEqual(sock.emitted.length, 1);
            assert.strictEqual(sock.emitted[0].name, 'stateUpdate');
        });
        it('state update should contain ships for the player as well as game parameters', function () {
            let game = new Game();
            let sock = new MockSocket();
            game.addPlayer(sock);
            assert.strictEqual(sock.emitted[0].data.playerState.ships.length > 0, true);
            assert.strictEqual(sock.emitted[0].data.mode, 'placement');
            assert.strictEqual(sock.emitted[0].data.squareCount > 0, true);
        });
        it('should add user as an observer if game has 2 or more players', function () {
            let game = new Game();
            for (let i = 0; i < 5; i++) {
                let player = game.addPlayer(new MockSocket());
                assert.strictEqual(player.role, i < 2 ? 'player' : 'observer');
            }
        });
        it('should add socket to participants', function () {
            let game = new Game();
            let count = 5;
            for (let i = 0; i < count; i++) {
                game.addPlayer(new MockSocket());
            }
            assert.strictEqual(Object.keys(game.participants).length, count);
        });
    });
    describe('#removePlayer', function () {
        it('should remove the player from the participants object', function () {
            let game = new Game();
            let sock = new MockSocket();
            game.addPlayer(sock);
            game.removePlayer(sock.id)
            assert.strictEqual(game.participants[sock.id], undefined);
        });
        it('should not fail if the player is not found', function () {
            let game = new Game();
            game.removePlayer(1);
        });
        it('should return true if the removed user was a "player"', function () {
            let game = new Game();
            let sock = new MockSocket();
            game.addPlayer(sock);
            let wasPlayer = game.removePlayer(sock.id)
            assert.strictEqual(wasPlayer, true);
        });
        it('should return false if the removed user was an "observer"', function () {
            let game = new Game();
            let sock = null;
            for (let i = 0; i < 5; i++) {
                sock = new MockSocket();
                game.addPlayer(sock);
            }
            // remove last player we added
            let wasPlayer = game.removePlayer(sock.id)
            assert.strictEqual(wasPlayer, false);
        });
        it('should clear our the player entry from the players array if the removed user was a "player"', function () {
            let game = new Game();
            let sock = new MockSocket();
            game.addPlayer(sock);
            game.removePlayer(sock.id)
            assert.strictEqual(game.players[0], null);
        });
    });
    describe('#reset', function () {
        it('should set the mode back to "placement"', function () {
            let game = new Game();
            game.addPlayer(new MockSocket());
            game.mode = 'play';
            game.reset();
            assert.strictEqual(game.mode, 'placement');
        });
        it('should reassign observers as players if there are too few', function () {
            let game = new Game();
            for (let i = 0; i < 10; i++) {
                game.addPlayer(new MockSocket());
            }
            // now remove just the 'players'
            game.removePlayer(game.players[1].id);
            game.removePlayer(game.players[0].id);
            game.reset();
            assert.notStrictEqual(game.players[0], null);
            assert.notStrictEqual(game.players[1], null);
            assert.strictEqual(game.players[0].role, 'player');
            assert.strictEqual(game.players[1].role, 'player');
        });
        it('should emit a state update', function () {
            let game = new Game();
            let sock = new MockSocket();
            game.addPlayer(sock);
            game.reset();
            //should have 2 emitted events since we get one on addPlayer and another on reset
            assert.strictEqual(sock.emitted.length, 2);
            assert.strictEqual(sock.emitted[sock.emitted.length - 1].name, 'stateUpdate');
        });
    });
    describe('#getState', function () {
        it('should only return ships for the player if user role is "player"', function () {
            let game = new Game();
            for (let i = 0; i < 3; i++) {
                let sock = new MockSocket();
                game.addPlayer(sock);
                let state = game.getState(sock.id);
                if (i < 2) {
                    assert.strictEqual(state.playerState.ships.length > 0, true);
                } else {
                    assert.strictEqual(state.playerState.ships.length == 0, true);
                }
            }
        });
        it('should return the mode, turn number and board dimensions no matter what role the user has', function () {
            let game = new Game();
            for (let i = 0; i < 3; i++) {
                let sock = new MockSocket();
                game.addPlayer(sock);
                let state = game.getState(sock.id);
                assert.notStrictEqual(state.mode, undefined);
                assert.strictEqual(state.turnNumber > 0, true);
                assert.strictEqual(state.squareCount > 0, true);
            }
        });
        it('should return observationState for observers only', function () {
            let game = new Game();
            for (let i = 0; i < 3; i++) {
                let sock = new MockSocket();
                game.addPlayer(sock);
                let state = game.getState(sock.id);
                if (i < 2) {
                    assert.strictEqual(state.observationState, undefined);
                } else {
                    assert.notStrictEqual(state.observationState, undefined);
                }
            }
        });
        it('should return both players ships in the observation state for observers', function () {
            let game = new Game();
            let sock = null;
            for (let i = 0; i < 3; i++) {
                sock = new MockSocket();
                game.addPlayer(sock);
            }
            // get observer state
            let state = game.getState(sock.id);
            assert.strictEqual(state.observationState.length, 2);
        });
    });
    describe('#getReadyCount', function () {
        it('should return the number of players that are "ready"', function () {
            let game= new Game();
            assert.strictEqual(game.getReadyCount(),0);
            game.addPlayer(new MockSocket());
            game.addPlayer(new MockSocket());
            assert.strictEqual(game.getReadyCount(),0);
            game.players[0].setReady([], true);
            assert.strictEqual(game.getReadyCount(),1);
            game.players[1].setReady([], true);
            assert.strictEqual(game.getReadyCount(),2);
        });
    });
});