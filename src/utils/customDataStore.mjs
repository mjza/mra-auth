class CustomDataStore {
    constructor() {
        this.data = {};
        this.setData = this.setData.bind(this);
        this.getValue = this.getValue.bind(this);
        this.resetData = this.resetData.bind(this);
        this.getData = this.getData.bind(this);
    }

    setData(key, value) {
        this.data[key] = value;
    }

    getValue(key) {
        return this.data[key];
    }

    resetData(){
        this.data = {};
    }

    getData() {
        return this.data;
    }
}
const { setData, getValue, resetData, getData } = new CustomDataStore();
export { getData, getValue, resetData, setData };

