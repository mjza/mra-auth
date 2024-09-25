/**
 * Evaluates ownership conditions specified in the policy. This function checks if the specified
 * user owns the data entity involved in the request, based on ownership columns specified in the table object.
 * Ownership is determined by comparing user ID against owner-specific columns for the requested action.
 *
 * @param {Object} request - The request object containing sub (subject), dom (domain), obj (object),
 *                           act (action), and attrs (attributes). This structure helps in specifying the
 *                           operation context.
 * @param {string} userType - The user type can be 'public', 'external', 'customer', 'internal'.
 *                            Access control logic may vary based on the user type.
 * @param {integer} userId - An integer representing the user making the request, it is used for ownership comparison.
 * @param {Object} table - An object representing the table or data source involved in the request.
 *                         It should specify the owner_column used to determine ownership.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the user is the owner and the action is permitted,
 *                     false otherwise.
 *
 * @throws {Error} Throws an error if there is a problem during the execution, such as a failure in database
 *                 access or data evaluation.
 */
async function checkOwnership(request, userType, userId, table) {
  try {
    // tables with ownerships are closed to public
    if (userType === 'public') {
      return false;
    }

    const { act, attrs } = request;
    const { owner_column: ownerColumn } = table || { owner_column: null };
    const { where, set } = attrs;  

    if (userType != 'internal') {
      if ('C' === act) {
        if (ownerColumn && (!set[ownerColumn] || set[ownerColumn] != userId)) {
          return false;
        }
      } else if ('R' === act) {
        if (ownerColumn && where[ownerColumn] && where[ownerColumn] != userId) {
          return false;
        }
      } else if ('U' === act) {
        if (ownerColumn && (!where[ownerColumn] || where[ownerColumn] != userId)) {
          return false;
        }
        if (ownerColumn && set[ownerColumn] && set[ownerColumn] != userId) {
          return false;
        }
      } else if ('D' === act) {
        if (ownerColumn && (!where[ownerColumn] || where[ownerColumn] != userId)) {
          return false;
        }
      } else {
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    throw err;
  }
}

// Export the function so it can be imported in other parts of your application.
export { checkOwnership };
