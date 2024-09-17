const db = require('../utils/database');
const { checkOwnership } = require('./casbinOwnership');
const { checkRelationship } = require('./casbinRelationship');
const customDataStore = require('../utils/customDataStore');

/**
 * Evaluates both dynamic conditions and static attributes.
 * @param {Object} request - The request object containing sub, dom, obj, act, and attrs.
 * @param {Object} policy - The policy object containing sub, dom, obj, act, cond, attrs, and eft.
 * @param {string} userType - The type of the user based on the passed role.
 * @returns {boolean} - True if the request satisfies the policy's conditions and attributes, false otherwise.
 */
async function customeEval(request, policy, userType) {
    customDataStore.resetData();

    const { sub, obj } = request;
    const user = await db.getUserByUsername(sub);
    const userId = user ? user.user_id : null;
    const table = await db.getTableByTableName(obj);

    // set ownership values of the request
    const { where, set } = await setConditions(request, policy.cond, userId, table);
    // Update the where and set in the request
    if (where && Object.keys(where).length > 0) {
        request.attrs.where = where;
    }
    if (set && Object.keys(set).length > 0) {
        request.attrs.set = set;
    }

    // Evaluate static attributes
    if (policy.attrs !== 'none') {
        const attrsResult = evalAttributes(request.attrs, policy.attrs);
        if (!attrsResult)
            return false;
    }

    // Evaluate dynamic conditions
    if (policy.cond !== 'none') {
        const result = await evalDynamicCondition(request, policy.cond, userType, userId, table);
        if (!result)
            return false;
    }

    await storeConditions(request.attrs);

    return true;
}

/**
 * Dynamically sets conditions for database operations based on the action type specified in
 * the request object and user ownership, specifically targeting owner, creator, and updator columns.
 * This function returns an object containing 'where' and 'set' conditions modified according to the
 * request action type and user identity, useful for queries needing authentication or ownership checks.
 * 
 * @param {Object} request - The request object, expected to contain an 'act' (action type) and 'attrs'
 *                           (attributes for the database operation) properties.
 * @param {string} condition - A condition indicating the context in which this function is invoked,
 *                             e.g., 'check_ownership' for read and delete operations.
 * @param {integer} userId - An integer representing id of the user making the request.
 * @param {Object} table - An object representing the table being operated on. Expected to contain
 *                         'owner_column', 'creator_column', and 'updator_column' properties, used to
 *                         attribute the ownership or modification of data to the current user.
 * @returns {Object} An object containing 'where' and 'set' conditions adjusted according to the request
 *                   specifics and user details.
 */
async function setConditions(request, condition, userId, table) {
    const { act, attrs } = request;
    const { owner_column, creator_column, updator_column } = table || { owner_column: null, creator_column: null, updator_column: null };
    // It might happen that attrs is just an empty object {}
    if (attrs && !attrs.set) {
        attrs.set = {};
    }
    if (attrs && !attrs.where) {
        attrs.where = {};
    }
    const { where, set } = attrs || { where: {}, set: {} };
    if ('R' === act && condition === 'check_ownership') {
        if (userId && userId > 0 && owner_column) {
            where[owner_column] = userId;
        }
    } else if ('C' === act) {
        if (userId && userId > 0 && creator_column) {
            set[creator_column] = userId;
        }
    } else if ('U' === act) {
        if (userId && userId > 0 && updator_column) {
            set[updator_column] = userId;
        }
        if (userId && userId > 0 && owner_column && condition === 'check_ownership' && where[owner_column] === undefined) {
            where[owner_column] = userId;
        }
    } else if ('D' === act && condition === 'check_ownership') {
        if (userId && userId > 0 && owner_column && where[owner_column] === undefined) {
            where[owner_column] = userId;
        }
    }

    return { where, set };
}

/**
 * Recursively compares two objects for deep equality.
 * 
 * @param {any} obj1 The first object to compare.
 * @param {any} obj2 The second object to compare.
 * @returns {boolean} True if both objects are deeply equal, false otherwise.
 */
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}

/**
* Evaluates static attributes against the policy's required attributes.
* @param {Object} requestAttrs - JSON object of request attributes.
* @param {string} policyAttrs - JSON string of policy attributes.
* @returns {boolean} - True if the request's attributes match the policy's attributes, false otherwise.
*/
function evalAttributes(requestAttrs, policyAttrs) {
    const polAttrs = JSON.parse(policyAttrs);
    return deepEqual(requestAttrs, polAttrs);
}

/**
 * Evaluates dynamic conditions specified in the policy. Depending on the condition specified,
 * this function delegates the request to specific sub-functions that handle various types of policy checks,
 * such as ownership and relational checks. It supports multiple user types and custom conditions based on
 * the provided arguments.
 *
 * @param {Object} request - The request object containing sub (subject), dom (domain), obj (object),
 *                           act (action), and attrs (attributes). This structure helps in specifying the
 *                           operational context.
 * @param {string} condition - The policy condition to evaluate, e.g., 'check_ownership' or 'check_relationship'.
 * @param {string} userType - The user type can be 'public', 'external', 'customer', 'internal'. Access control
 *                            logic may vary based on the user type.
 * @param {integer} userId - An integer representing id of the user making the request.
 * @param {Object} table - An object representing the table or data source involved in the request, which may
 *                         include metadata like ownership or relationship columns.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the user is the owner and the action is permitted,
 *                     false otherwise.
 *
 * @throws {Error} Throws an error if there is a problem during the execution, such as a failure in
 *                 policy evaluation or if no valid condition handler is found.
 */
async function evalDynamicCondition(request, condition, userType, userId, table) {
    if (condition === 'check_ownership') {
        return await checkOwnership(request, userType, userId, table);
    } else if (condition === 'check_relationship') {
        return await checkRelationship(request, userType, userId, table);
    }
    throw new Error("Unknown condition passed.");
}

/**
 * Sets conditions for database operations based on request attributes, modifying the global
 * customDataStore object by setting 'where' and 'set' conditions. This function is specifically
 * designed to prepare the environment for database operations later in the request processing
 * pipeline by updating conditions dynamically based on the provided attributes.
 * 
 * @param {Object} attrs - The attributes of the request object for the database
 *                           operation which includes 'where' and 'set' properties.
 */
async function storeConditions(attrs) {
    const { where, set } = attrs;
    if (where && Object.keys(where).length > 0) {
        customDataStore.setData('where', where);
    }
    if (set && Object.keys(set).length > 0) {
        customDataStore.setData('set', set);
    }
}

module.exports = { customeEval };