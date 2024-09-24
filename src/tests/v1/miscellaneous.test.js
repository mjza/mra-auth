const { sleep } = require('../../utils/miscellaneous');

// Mocking setTimeout for more controlled testing
jest.useFakeTimers();

describe('sleep function', () => {
    it('should resolve after the specified time', () => {
        const ms = 500;
        const sleepPromise = sleep(ms);

        // Fast-forward time by 'ms' milliseconds
        jest.advanceTimersByTime(ms);

        // Run any pending timers (like those created by setTimeout)
        jest.runOnlyPendingTimers();

        // Expect the promise to resolve
        return expect(sleepPromise).resolves.toBeUndefined();
    });

    it('should delay execution for the specified duration', async () => {
        jest.useRealTimers(); // Use real timers for this test case
        
        const startTime = Date.now();
        const delay = 100; // 100 milliseconds

        await sleep(delay);
        const endTime = Date.now();

        expect(endTime - startTime).toBeGreaterThanOrEqual(delay);

        jest.useFakeTimers(); // Switch back to fake timers if needed for other tests
    });
});
