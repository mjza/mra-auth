const db = require('../utils/database');
const customDataStore = require('../utils/customDataStore');

/**
* Evaluates dynamic conditions specified in the policy.
* @param {Object} request - The request object containing sub, dom, obj, act, and attrs.
* @param {string} userType - The user type can be 'public', 'external', 'customer', 'internal'.
* @param {Object} user - An object representing the user making the request.
* @param {Object} table - An object representing the table or data source involved in the request.
* @returns {boolean} - True if the condition is met, false otherwise.
*/
async function checkRelationship(request, userType, user, table) {
  try {
    if (userType === 'public') {
      // tables with ownerships are closed to public
      return false;
    }
    const { dom: customerId } = request;
    const { userId } = user;
    const { act, attrs } = request;
    if (attrs && !attrs.set) {
      attrs.set = {};
    }
    if (attrs && !attrs.where) {
      attrs.where = {};
    }
    const relationship = await db.getValidRelationshipByUserCustomer(userId, customerId);
    if (relationship) {
      const { creatorColumn, updatorColumn } = table || { creatorColumn: null, updatorColumn: null };
      const { where, set } = attrs || { where: {}, set: {} };
      if ('C' === act && creatorColumn) {
        set[creatorColumn] = userId;
      } else if ('U' === act && updatorColumn) {
        set[updatorColumn] = userId;
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
  } catch (err) {
    throw err;
  }
}

// Export the function for use in other parts of your application.
module.exports = { checkRelationship };
