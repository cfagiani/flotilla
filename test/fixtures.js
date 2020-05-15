class MockSocket {
    constructor() {
        this.emitted = [];
    }

    emit(name, data) {
        this.emitted.push({name: name, data: data});
    }
}

module.exports = MockSocket;