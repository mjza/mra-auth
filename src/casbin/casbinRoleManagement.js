const fs = require('fs');
const { parse } = require('csv-parse');
const db = require('../utils/database');

/**
 * Deletes all policies where the domain is '0'.
 * This function iterates over all policies filtered by the domain value '0',
 * and removes each one from the current policy set.
 * After deletion, it saves the policy changes to the storage.
 * 
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
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
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
 * @param {string} csvFilePath Path to the CSV file containing policies to import.
 * @returns {Promise<void>} A promise that resolves once all policies are imported and changes are saved.
 */
async function importPoliciesFromCSV(enforcer, csvFilePath) {
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  
  // Convert the parse call to be promise-based for proper async handling
  const records = await new Promise((resolve, reject) => {
    parse(csvContent, {
      from_line: 2, // Skip the header row and seprator line
      skip_empty_lines: true,
      delimiter: ";"
    }, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });

  for (const record of records) {
    const [sub, dom, obj, act, cond, attrs, eft] = record;
    if ([sub, dom, obj, act, cond, attrs, eft].some(v => v === undefined)) {
      throw new Error('All parameters are mandatory, but at least one undefined value was provided.');
    }
    const policy = [sub, dom, obj, act, cond, attrs, eft];
    await enforcer.addPolicy(...policy);
  }
  await enforcer.savePolicy();
}

/**
 * Adds a role to a user within a specific domain.
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} role The role to be added to the user.
 * @param {string} domain The domain within which the role is added.
 */
async function addRoleForUserInDomain(enforcer, username, role, domain) {
    const added = await enforcer.addRoleForUser(username, role, domain);
    if (added) {
        console.log(`Role ${role} added to user ${username} in domain ${domain}.`);
        await enforcer.savePolicy();
    }
}

/**
 * Removes a role from a user within a specific domain.
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} role The role to be removed from the user.
 * @param {string} domain The domain within which the role is removed.
 */
async function removeRoleForUserInDomain(enforcer, username, role, domain) {
    const removed = await enforcer.deleteRoleForUser(username, role, domain);
    if (removed) {
        console.log(`Role ${role} removed from user ${username} in domain ${domain}.`);
        await enforcer.savePolicy();
    }
}

/**
 * Checks if a user has a role within a specific domain.
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} role The role to check.
 * @param {string} domain The domain within which to check the role.
 * @returns {Promise<boolean>} True if the user has the role, false otherwise.
 */
async function hasRoleForUserInDomain(enforcer, username, role, domain) {
    const roles = await enforcer.getRolesForUser(username, domain);
    return roles.includes(role);
}

/**
 * Lists all roles a user has within a specific domain.
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @param {string} domain The domain within which to list the roles.
 * @returns {Promise<string[]>} An array of role names.
 */
async function listRolesForUserInDomain(enforcer, username, domain) {
    return await enforcer.getRolesForUser(username, domain);
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
  let domains = await db.getUserDomains(username);
  let rolesAndDomains = [];

  for (const domain of domains) {
    // Retrieve roles for the user in the current domain
    const roles = await enforcer.getRolesForUser(username, domain);
    
    // For each role, create an object with role and domain, then add to the result array
    roles.forEach(role => rolesAndDomains.push({ role, domain }));
  }

  return rolesAndDomains;
}


/**
 * Lists all roles a user has.
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
 * @param {string} username The username of the user.
 * @returns {Promise<string[]>} An array of role names.
 */
async function listRolesForUser(enforcer, username) {
  return await enforcer.getRolesForUser(username);
}

/**
 * Gets permissions for a given role within a specific domain.
 * @param {import('casbin').Enforcer} enforcer The Casbin enforcer instance.
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
module.exports = { deletePoliciesForDomainZero, importPoliciesFromCSV, addRoleForUserInDomain, removeRoleForUserInDomain, hasRoleForUserInDomain, listRolesForUserInDomain, listRolesForUserInDomains, getPermissionsForRoleInDomain, listRolesForUser };