import { getData, getValue, resetData, setData } from '../../utils/customDataStore.mjs';
describe('Test CustomDataStore', () => {
    beforeEach(() => {
        resetData(); // Reset data before each test to ensure test isolation
    });

    test('setData should store the key-value pair correctly', () => {
        setData('name', 'John Doe');
        expect(getValue('name')).toBe('John Doe');
    });

    test('getValue should return undefined for non-existing keys', () => {
        expect(getValue('age')).toBeUndefined();
    });

    test('resetData should clear all stored data', () => {
        setData('name', 'John Doe');
        setData('age', 30);
        resetData();
        expect(getValue('name')).toBeUndefined();
        expect(getValue('age')).toBeUndefined();
    });

    test('getData should return an object with all stored key-value pairs', () => {
        setData('name', 'John Doe');
        setData('age', 30);
        const allData = getData();
        expect(allData).toEqual({
            name: 'John Doe',
            age: 30
        });
    });

    test('setData should overwrite existing key-value pair', () => {
        setData('name', 'John Doe');
        setData('name', 'Jane Doe');
        expect(getValue('name')).toBe('Jane Doe');
    });
});
