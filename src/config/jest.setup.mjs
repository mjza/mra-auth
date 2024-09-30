test('Environment variable should be loaded', () => {
    expect(process.env.DOC_USER).toBeDefined();
    expect(process.env.DOC_PASS).toBeDefined();
});

describe('Global App Instance', () => {
    it('should be an instance of express app', () => {
        // Check for specific properties/methods of an express app
        expect(global.__APP__.use).toBeDefined();
        expect(global.__APP__.get).toBeDefined();
        expect(global.__APP__.post).toBeDefined();
        expect(global.__APP__.listen).toBeDefined();
    });
});
