const db = require('../utils/database');
const { checkOwnership } = require('./casbinOwnership');
const { checkRelationship } = require('./casbinRelationship');
const customDataStore = require('../utils/customDataStore');

/**
 * Evaluates both dynamic conditions and static attributes.
 * @param {Object} request - The request object containing sub, dom, obj, act, and attrs.
 * @param {Object} policy - The policy object containing sub, dom, obj, act, cond, attrs, and eft.
 * @param {string[]} roles - The roles object is an array of strings.
 * @param {string[]} userTypes - The user types can be an array with 'public', 'external', 'customer', 'internal' elements
 * @returns {boolean} - True if the request satisfies the policy's conditions and attributes, false otherwise.
 */
async function customeEval(request, policy, roles, userTypes) {
    customDataStore.resetData();

    const { sub, obj } = request;
    const user = await db.getUserByUsername(sub);
    const table = await db.getTableByTableName(obj);

    // Evaluate static attributes
    if (policy.attrs !== 'none') {
        const attrsResult = evalAttributes(request.attrs, policy.attrs);
        if (!attrsResult)
            return false;
    }

    // Evaluate dynamic conditions
    // TODO: condition and role and userType must be matched. 
    if (policy.cond !== 'none') {
        let conditionResult = false;
        for(let userType of userTypes){
            conditionResult = conditionResult || await evalDynamicCondition(request, policy, roles, userType, user, table);
            if(conditionResult)
                return true;
        }
        if (!conditionResult)
            return false;
    } else {
        await setConditions(request, user, table);
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
    return Object.keys(polAttrs).every(key => polAttrs[key] === requestAttrs[key]);
}

/**
* Evaluates dynamic conditions specified in the policy.
* @param {Object} request - The request object containing sub, dom, obj, act, and attrs.
* @param {Object} policy - The policy object containing sub, dom, obj, act, cond, attrs, and eft.
* @param {string[]} roles - The roles object is an array of strings.
* @param {string} userType - The user type can be 'public', 'external', 'customer', 'internal'.
* @param {Object} user - An object representing the user making the request.
* @param {Object} table - An object representing the table or data source involved in the request.
* @returns {boolean} - True if the condition is met, false otherwise.
*/
async function evalDynamicCondition(request, policy, roles, userType, user, table) {
    const condition = policy.cond;
    if (condition === 'check_ownership') {
        return await checkOwnership(request, policy, roles, userType, user, table);
    } else if (condition === 'check_relationship') {
        return await checkRelationship(request, policy, roles, userType, user, table);
    }
    // Add more condition cases as needed
    return false;
}

/**
 * Sets conditions for database operations based on the request action and attributes,
 * as well as user and table information. This function is designed to prepare and
 * apply data modification conditions, specifically targeting creator and updator
 * columns for create and update actions respectively.
 * 
 * The function modifies the global customDataStore object by setting 'where' and 'set'
 * conditions based on the request's action type ('C' for create, 'U' for update) and
 * the provided attributes. It uses the user's ID to mark the creator or updator column
 * in the 'set' condition. Additionally, it populates 'where' conditions if specified
 * in the request.
 * 
 * Note: This function directly affects the global customDataStore object and does not
 * return any value. It should be used when the intention is to prepare conditions for
 * database operations that will be executed later in the request processing pipeline.
 *
 * @param {Object} request - The request object, expected to contain an 'act' (action type)
 * and 'attrs' (attributes for the database operation) properties.
 * @param {Object} user - An object representing the user performing the operation.
 * The function expects this object to at least contain a 'user_id' property.
 * @param {Object} table - An object representing the table being operated on.
 * Expected to contain 'creator_column' and 'updator_column' properties, which are used
 * to attribute the creation or modification of data to the current user.
 */
async function setConditions(request, user, table) {
    const { act, attrs } = request;
    const { creator_column, updator_column } = table;
    const { where, set } = attrs || { where: {}, set: {} };
    if ('C' === act) {
        if (user && user.user_id > 0 && creator_column != null) {
            set[creator_column] = user.user_id;
        }
    } else if ('U' === act) {
        if (user && user.user_id > 0 && updator_column != null) {
            set[updator_column] = user.user_id;
        }
    }
    if (where && Object.keys(where).length > 0) {
        customDataStore.setData('where', where);
    }
    if (set && Object.keys(set).length > 0) {
        customDataStore.setData('set', set);
    }
}

module.exports = { customeEval };