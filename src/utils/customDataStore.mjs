/**
 * A custom data store class to manage key-value data pairs.
 */
class CustomDataStore {
    /**
     * Initializes a new instance of the CustomDataStore class.
     */
    constructor() {
        /**
         * @private
         * @type {Object.<string, any>}
         * @description Internal data storage for key-value pairs.
         */
        this.data = {};
        
        this.setData = this.setData.bind(this);
        this.getValue = this.getValue.bind(this);
        this.resetData = this.resetData.bind(this);
        this.getData = this.getData.bind(this);
    }

    /**
     * Sets a value for a specified key in the data store.
     * @param {string} key - The key to set in the data store.
     * @param {any} value - The value to associate with the key.
     */
    setData(key, value) {
        this.data[key] = value;
    }

    /**
     * Retrieves the value associated with the specified key.
     * @param {string} key - The key whose value needs to be retrieved.
     * @returns {any} The value associated with the specified key, or `undefined` if the key does not exist.
     */
    getValue(key) {
        return this.data[key];
    }

    /**
     * Resets the data store, removing all key-value pairs.
     */
    resetData() {
        this.data = {};
    }

    /**
     * Retrieves the entire data object stored in the data store.
     * @returns {Object.<string, any>} The entire key-value store as an object.
     */
    getData() {
        return this.data;
    }
}

// Exporting the functions for external usage
const { setData, getValue, resetData, getData } = new CustomDataStore();
export { getData, getValue, resetData, setData };
