class CustomDataStore {
    constructor() {
        this.data = {};
        this.setData = this.setData.bind(this);
        this.getData = this.getData.bind(this);
        this.resetData = this.resetData.bind(this);
        this.getAllData = this.getAllData.bind(this);
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

    getAllData() {
        return this.data;
    }
}
const { setData, getData, resetData, getAllData } = new CustomDataStore();
export {setData, getData, resetData, getAllData} 
