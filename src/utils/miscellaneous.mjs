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
