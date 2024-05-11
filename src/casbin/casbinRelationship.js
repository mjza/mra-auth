const db = require('../utils/database');

/**
 * Evaluates dynamic conditions specified in the policy. This function determines if the specified
 * user can perform an action on a data entity based on their relationship to the domain specified
 * in the request. The function utilizes other utilities to resolve complex domain relationships
 * and make decisions based on these resolved data points.
 *
 * @param {Object} request - The request object containing sub, dom, obj, act, and attrs, which represent
 *                           the subject, domain, object, action, and additional attributes of the request.
 * @param {string} userType - The user type can be 'public', 'external', 'customer', 'internal'.
 * @param {integer} userId - An integer representing id of the user making the request.
 * @param {Object} table - An object representing the table or data source involved in the request, which may include metadata like domain column.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the user meets the condition to perform the action, false otherwise.
 *
 * @throws {Error} Throws an error if there is a problem during the execution, such as a failure in database access or
 *                 data resolution.
 */
async function checkRelationship(request, userType, userId, table) {
  try {
    if (userType === 'public') {
      // Tables with relationship are closed to public
      return false;
    }

    const { dom: domain } = request;
    const { act, attrs } = request;
    const { where, set } = attrs;  

    const relationship = await db.getValidRelationshipByUserCustomer(userId, domain);
    if (!relationship) {
      return false;
    }

    const domainColumn = table?.domain_column || null;
    const actionMap = {
      'R': 'read',
      'D': 'delete',
      'C': 'create',
      'U': 'update'
    };

    const action = actionMap[act];
    if (action) {
      const target = action === 'create' || action === 'update' ? set : where;
      if (domainColumn) {
        return await resolveDomainColumn(domainColumn, target, domain);
      }
    }
    return false;
  } catch (err) {
    throw err;
  }
}

/**
 * Recursively resolves domain columns that reference values in potentially multiple related tables.
 * This function checks if the specified `domainColumn` directly corresponds to a value in `target`
 * matching the provided `domain`, or if `domainColumn` implies a chained relationship involving multiple tables.
 * It resolves these relationships by fetching the necessary rows from each subsequent table until the final
 * domain column check can be performed.
 *
 * @param {string} domainColumn - The column name to check, which can be a simple column or a chained reference
 *                                 in the format 'tableName.columnName'. If chained, it indicates that the target
 *                                 column is in another table, and this function will resolve it recursively.
 * @param {Object} target - The object (usually a row from a database) containing the initial data to check against
 *                          the domain column.
 * @param {string} domain - The value to be compared against the value of the domain column in the target object or
 *                       resolved row. This is typically a customer ID or other identifier to verify relationship.
 *
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the domain column in the final table matches
 *                               the provided domain value, `false` otherwise. It recursively resolves each table
 *                               and column reference until a direct comparison can be made.
 */
async function resolveDomainColumn(domainColumn, target, domain) {
  if (!domainColumn.includes('.')) {
    // Simple domain column
    return String(target[domainColumn]) === domain;
  } else {
    // Complex domain column with references to other tables
    const parts = domainColumn.split('.');
    const tableName = parts[0];
    const columnName = parts[1];

    const table = await db.getTableByTableName(tableName);
    if (table) {
      const rowData = await db.getRowById(table, columnName, target[columnName]);

      if (rowData) {
        domainColumn = table.domain_column;
        if (domainColumn.includes('.')) {
          // Recursive resolution for chained references
          return resolveDomainColumn(domainColumn, rowData, domain);
        } else {
          // Final resolution step
          return String(rowData[domainColumn]) === domain;
        }
      }
    }
    return false;
  }
}

// Export the function for use in other parts of your application.
module.exports = { checkRelationship };
