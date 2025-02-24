import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import { getUserDomains } from '../utils/database.mjs';

/**
 * @typedef {Object} CasbinEnforcer
 * @property {function(string, string): Promise<boolean>} hasPolicy Checks if a policy exists.
 * @property {function(string, string): Promise<void>} removePolicy Removes a policy.
 */

/**
 * Deletes all policies where the domain is '0'.
 * This function iterates over all policies filtered by the domain value '0',
 * and removes each one from the current policy set.
 * After deletion, it saves the policy changes to the storage.
 *
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @returns {Promise<void>} A promise that resolves once all matching policies are deleted and changes are saved.
 */
async function deletePoliciesForDomainZero(enforcer) {
  // Assuming domain is represented in the second field of the policy (v1)
  const policies = await enforcer.getFilteredPolicy(1, '0');
  for (const policy of policies) {
    await enforcer.removePolicy(...policy);
  }
  await enforcer.savePolicy();
}

/**
 * Imports policies from a CSV file and adds them to the current policy set.
 * The CSV file should not include a header row and should structure each row
 * according to the expected policy format: sub, dom, obj, act, cond, eft.
 * Undefined values within a policy are filtered out before addition.
 * After importing all policies, it saves the policy changes to the storage.
 *
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} csvFilePath Path to the CSV file containing policies to import.
 * @returns {Promise<void>} A promise that resolves once all policies are imported and changes are saved.
 */
async function importPoliciesOrRolesFromCSV(enforcer, csvFilePath) {
  const csvContent = readFileSync(csvFilePath, 'utf8');

  // Convert the parse call to be promise-based for proper async handling
  const records = await new Promise((resolve, reject) => {
    parse(csvContent, {
      from_line: 2, // Skip the header row
      skip_empty_lines: true,
      delimiter: ";",
      trim: true,
    }, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });

  for (const record of records) {
    // Determine the type of rule based on the length of the record
    if (record.length === 3) {
      // Handle g rule: g, user, role, domain
      const [user, role, domain] = record;
      if ([user, role, domain].some(v => v === undefined)) {
        throw new Error('All parameters for g rule are mandatory, but at least one undefined value was provided.');
      }
      await enforcer.addGroupingPolicy(user, role, domain);
    } else if (record.length === 7) {
      // Handle p rule: sub, dom, obj, act, cond, attrs, eft
      const [sub, dom, obj, act, cond, attrs, eft] = record;
      if ([sub, dom, obj, act, cond, attrs, eft].some(v => v === undefined)) {
        throw new Error('All parameters for p rule are mandatory, but at least one undefined value was provided.');
      }
      await enforcer.addPolicy(sub, dom, obj, act, cond, attrs, eft);
    } else {
      throw new Error('Invalid record format: ' + record.join(';'));
    }
  }

  await enforcer.savePolicy();
}

/**
 * Adds a role to a user within a specific domain.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} role The role to be added to the user.
 * @param {string} domain The domain within which the role is added.
 */
async function addRoleForUserInDomain(enforcer, username, role, domain) {
  const added = await enforcer.addRoleForUser(username.trim().toLowerCase(), role, domain);
  if (added) {
    console.log(`Role ${role} has been added to user ${username} in domain ${domain}.`);
    await enforcer.savePolicy();
  }
}

/**
 * Removes a role from a user within a specific domain.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} role The role to be removed from the user.
 * @param {string} domain The domain within which the role is removed.
 */
async function removeRoleForUserInDomain(enforcer, username, role, domain) {
  const removed = await enforcer.deleteRoleForUser(username.trim().toLowerCase(), role, domain);
  if (removed) {
    console.log(`Role ${role} has been removed from user ${username} in domain ${domain}.`);
    await enforcer.savePolicy();
  }
}

/**
 * Removes all roles from a user within a specific domain.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} domain The domain within which the role is removed.
 */
async function removeRolesForUserInDomain(enforcer, username, domain) {
  const removed = await enforcer.deleteRolesForUser(username.trim().toLowerCase(), domain);
  if (removed) {
    console.log(`All roles have been removed from user ${username} in domain ${domain}.`);
    await enforcer.savePolicy();
  }
}

/**
 * Removes all roles from a user in all domains.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 */
async function removeRolesForUserInAllDomains(enforcer, username) {
  const removed = await enforcer.deleteRolesForUser(username.trim().toLowerCase());
  if (removed) {
    console.log(`All roles have been removed from user ${username} in all domains.`);
    await enforcer.savePolicy();
  }
}

/**
 * Checks if a user has a role within a specific domain.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} role The role to check.
 * @param {string} domain The domain within which to check the role.
 * @returns {Promise<boolean>} True if the user has the role, false otherwise.
 */
async function hasRoleForUserInDomain(enforcer, username, role, domain) {
  const roles = await enforcer.getRolesForUser(username.trim().toLowerCase(), domain);
  return roles.includes(role);
}

/**
 * Lists all roles a user has within a specific domain.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} domain The domain within which to list the roles.
 * @returns {Promise<string[]>} An array of role names.
 */
async function listRolesForUserInDomain(enforcer, username, domain) {
  return await enforcer.getRolesForUser(username.trim().toLowerCase(), domain);
}

/**
 * Lists all roles for a user across all domains they are associated with.
 * This function returns a list of domains for the user.
 *
 * @param {Enforcer} enforcer - The Casbin enforcer instance.
 * @param {string} username - The username of the user.
 * @returns {Promise<Array<{role: string, domain: string}>>} - A promise that resolves to an array of objects, each containing a role and the domain it belongs to.
 */
async function listRolesForUserInDomains(enforcer, username) {
  let domains = await getUserDomains(username.trim().toLowerCase());
  let rolesAndDomains = [];

  for (const domain of domains) {
    // Retrieve roles for the user in the current domain
    const roles = await enforcer.getRolesForUser(username.trim().toLowerCase(), domain);

    // For each role, create an object with role and domain, then add to the result array
    roles.forEach(role => rolesAndDomains.push({ role, domain }));
  }

  return rolesAndDomains;
}


/**
 * Lists all roles a user has.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @returns {Promise<string[]>} An array of role names.
 */
async function listRolesForUser(enforcer, username) {
  return await enforcer.getRolesForUser(username.trim().toLowerCase());
}

/**
 * Gets permissions for a given role within a specific domain.
 * @param {CasbinEnforcer} enforcer The Casbin enforcer instance.
 * @param {string} role The role to retrieve permissions for.
 * @param {string} domain The domain within which to retrieve permissions.
 * @returns {Promise<string[][]>} An array of permissions.
 */
async function getPermissionsForRoleInDomain(enforcer, role, domain) {
  // Filter policies based on the role and domain.
  // Assuming the role is the subject (index 0), domain is at index 1,
  // and permissions start from index 2 (object, action).
  const policies = await enforcer.getFilteredPolicy(0, role, domain);
  return policies.map(policy => {
    // Returning only the relevant parts of each policy: object and action.
    // Adjust the indices if your policy structure is different.
    const obj = policy[2];
    const act = policy[3];
    return [obj, act];
  });
}

// Export the function for use in other parts of your application.
export { addRoleForUserInDomain, deletePoliciesForDomainZero, getPermissionsForRoleInDomain, hasRoleForUserInDomain, importPoliciesOrRolesFromCSV, listRolesForUser, listRolesForUserInDomain, listRolesForUserInDomains, removeRoleForUserInDomain, removeRolesForUserInAllDomains, removeRolesForUserInDomain };
