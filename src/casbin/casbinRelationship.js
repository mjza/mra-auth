const db = require('../utils/database');
const customDataStore = require('../utils/customDataStore');

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
async function checkRelationship(request, policy, roles, userType, user, table) {
  try {
    if (userType === 'public') {
      // tables with ownerships are closed to public
      return false;
    }
    const { dom } = request;
    const { user_id } = user;
    const relationship = await db.getValidRelationshipByUserCustomer(user_id, dom);
    if (relationship) {
      const { creator_column, updator_column } = table;
      const { where, set } = attrs || { where: {}, set: {} };
      if ('C' === act) {
        set[creator_column] = user.user_id;
      } else if ('U' === act) {
        set[updator_column] = user.user_id;
      }
      if (where && Object.keys(where).length > 0) {
        customDataStore.setData('where', where);
      }
      if (set && Object.keys(set).length > 0) {
        customDataStore.setData('set', set);
      }
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

// Export the function for use in other parts of your application.
module.exports = { checkRelationship };
