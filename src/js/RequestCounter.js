class RequestCounter {

    constructor() {
        this.requestsResolved = 0;
        this.listeners = [];
    }

    add() {
        this.requestsResolved++;
        for (const listener of this.listeners) {
            listener(this.requestsResolved);
        }
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        this.listeners.remove(listener);
    }
}

module.exports = RequestCounter;
