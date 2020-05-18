class MockSocket {
    constructor() {
        this.emitted = [];
        this.id = Math.random();
    }

    emit(name, data) {
        this.emitted.push({name: name, data: data});
    }
}

module.exports = MockSocket;