class ObservableInteger {

    constructor(value) {
        this.value = 0;
        this.listeners = [];
    }

    increment() {
        this.set(this.value + 1);
    }

    substract(value) {
        this.set(this.value - value);
    }

    set(value) {
        this.value = value;
        for (const listener of this.listeners) {
            listener(this.value);
        }
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        this.listeners.remove(listener);
    }
}

module.exports = ObservableInteger;
