class CustomDataStore {
    constructor() {
        this.data = {};
    }

    setData(key, value) {
        this.data[key] = value;
    }

    getData(key) {
        return this.data[key];
    }

    resetData(){
        this.data = {};
    }

    getData() {
        return this.data;
    }
}

module.exports = new CustomDataStore();
