/**
 * Pauses the execution for a specified amount of time.
 *
 * @param {number} ms - The number of milliseconds to pause.
 * @returns {Promise<void>} A promise that resolves after the specified time has elapsed.
 *
 * @example
 * // Pauses execution for 1 second
 * await sleep(1000);
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export { sleep };

/**
 * Checks if an object is empty.
 *
 * An object is considered empty if it has no own enumerable properties.
 *
 * @param {Object} obj - The object to check.
 * @returns {boolean} Returns `true` if the object is empty, otherwise `false`.
 *
 * @example
 *
 * const obj1 = {};
 * console.log(isEmptyObject(obj1)); // true
 *
 * const obj2 = { key: 'value' };
 * console.log(isEmptyObject(obj2)); // false
 */
const isEmptyObject = (obj) => Object.keys(obj).length === 0;

export { isEmptyObject };
