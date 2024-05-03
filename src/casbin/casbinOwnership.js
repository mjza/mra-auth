const customDataStore = require('../utils/customDataStore');

/**
* Evaluates dynamic conditions specified in the policy.
* @param {Object} request - The request object containing sub, dom, obj, act, and attrs.
* @param {string} userType - The user type can be 'public', 'external', 'customer', 'internal'.
* @param {Object} user - An object representing the user making the request.
* @param {Object} table - An object representing the table or data source involved in the request.
* @returns {boolean} - True if the condition is met, false otherwise.
*/
async function checkOwnership(request, userType, user, table) {
  try {
    if (userType === 'public') {
      // tables with ownerships are closed to public
      return false;
    }
    const { act, attrs } = request;
    const { ownerColumn, creatorColumn, updatorColumn } = table || { ownerColumn: null, creatorColumn: null, updatorColumn: null };
    if (attrs && !attrs.set) {
      attrs.set = {};
    }
    if (attrs && !attrs.where) {
      attrs.where = {};
    }
    const { where, set } = attrs || { where: {}, set: {} };

    if (userType != 'internal') {
      if ('C' === act) {
        if (ownerColumn && (!set[ownerColumn] || set[ownerColumn] != user.userId)) {
          return false;
        }
        if (creatorColumn) {
          set[creatorColumn] = user.userId;
        }
        customDataStore.setData('set', set);
      } else if ('R' === act) {
        if (ownerColumn && where[ownerColumn] && where[ownerColumn] != user.userId) {
          return false;
        }
        if (ownerColumn) {
          where[ownerColumn] = user.userId;
        }
        customDataStore.setData('where', where);
      } else if ('U' === act) {
        if (ownerColumn && (!where[ownerColumn] || where[ownerColumn] != user.userId)) {
          return false;
        }
        if (ownerColumn && set[ownerColumn] && set[ownerColumn] != user.userId) {
          return false;
        }
        if (updatorColumn) {
          set[updatorColumn] = user.userId;
        }
        customDataStore.setData('where', where);
        customDataStore.setData('set', set);
      } else if ('D' === act) {
        if (ownerColumn && (!where[ownerColumn] || where[ownerColumn] != user.userId)) {
          return false;
        }
        customDataStore.setData('where', where);
      } else {
        return false;
      }
    } else {
      if (where && Object.keys(where).length > 0) {
        customDataStore.setData('where', where);
      }
      if (set && Object.keys(set).length > 0) {
        customDataStore.setData('set', set);
      }
    }
    return true;
  } catch (err) {
    throw err;
  }
}

// Export the function so it can be imported in other parts of your application.
module.exports = { checkOwnership };