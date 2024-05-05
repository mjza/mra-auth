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
    const { owner_column, creator_column, updator_column } = table || { owner_column: null, creator_column: null, updator_column: null };
    if (attrs && !attrs.set) {
      attrs.set = {};
    }
    if (attrs && !attrs.where) {
      attrs.where = {};
    }
    const { where, set } = attrs || { where: {}, set: {} };

    if (userType != 'internal') {
      if ('C' === act) {
        if (owner_column && (!set[owner_column] || set[owner_column] != user.user_id)) {
          return false;
        }
        if (creator_column) {
          set[creator_column] = user.user_id;
        }
        customDataStore.setData('set', set);
      } else if ('R' === act) {
        if (owner_column && where[owner_column] && where[owner_column] != user.user_id) {
          return false;
        }
        if (owner_column) {
          where[owner_column] = user.user_id;
        }
        customDataStore.setData('where', where);
      } else if ('U' === act) {
        if (owner_column && (!where[owner_column] || where[owner_column] != user.user_id)) {
          return false;
        }
        if (owner_column && set[owner_column] && set[owner_column] != user.user_id) {
          return false;
        }
        if (updator_column) {
          set[updator_column] = user.user_id;
        }
        customDataStore.setData('where', where);
        customDataStore.setData('set', set);
      } else if ('D' === act) {
        if (owner_column && (!where[owner_column] || where[owner_column] != user.user_id)) {
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