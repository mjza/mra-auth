const { checkOwnership } = require('./casbinOwnership');
const { checkRelationship } = require('./casbinRelationship');

/**
 * Evaluates both dynamic conditions and static attributes.
 * @param {Object} r - The request object containing sub, dom, obj, act, and attrs.
 * @param {Object} p - The policy object containing sub, dom, obj, act, cond, attrs, and eft.
 * @returns {boolean} - True if the request satisfies the policy's conditions and attributes, false otherwise.
 */
async function customeEval(r, p) {
    // Evaluate dynamic conditions
    if (p.cond !== 'none') {
        const conditionResult = evalDynamicCondition(r, p.cond);
        if (!conditionResult) return false;
    }

    // Evaluate static attributes
    if (p.attrs !== 'none') {
        const attrsResult = evalAttributes(r.attrs, p.attrs);
        if (!attrsResult) return false;
    }

    return true;
}

/**
* Evaluates dynamic conditions specified in the policy.
* @param {Object} r - The request object.
* @param {string} condition - The condition string from the policy.
* @returns {boolean} - True if the condition is met, false otherwise.
*/
function evalDynamicCondition(r, condition) {
    // Implement your logic here based on the condition
    // Example:
    if (condition === 'check_ownership') {
        return checkOwnership(r.sub, r.dom, r.obj, r.attrs); // Implement checkOwnership accordingly
    } else if (condition === 'check_relationship') {
        return checkRelationship(r.sub, r.dom, r.obj, r.attrs); // Implement checkRelationship accordingly
    }
    // Add more condition cases as needed
    return false;
}

/**
* Evaluates static attributes against the policy's required attributes.
* @param {string} requestAttrs - JSON string of request attributes.
* @param {string} policyAttrs - JSON string of policy attributes.
* @returns {boolean} - True if the request's attributes match the policy's attributes, false otherwise.
*/
function evalAttributes(requestAttrs, policyAttrs) {
    const reqAttrs = JSON.parse(requestAttrs);
    const polAttrs = JSON.parse(policyAttrs);
    return Object.keys(polAttrs).every(key => polAttrs[key] === reqAttrs[key]);
}

module.exports = { customeEval };