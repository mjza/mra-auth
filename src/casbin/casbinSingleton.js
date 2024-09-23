const { newEnforcer } = require('casbin');
const TypeORMAdapter = require('typeorm-adapter').default;
const { customeEval } = require('./casbinEvaluation');
const {
  deletePoliciesForDomainZero,
  importPoliciesOrRolesFromCSV,
  addRoleForUserInDomain: addRoleForUserInDomainWithEnforcer,
  removeRoleForUserInDomain: removeRoleForUserInDomainWithEnforcer,
  removeRolesForUserInDomain: removeRolesForUserInDomainWithEnforcer,
  removeRolesForUserInAllDomains: removeRolesForUserInAllDomainsWithEnforcer,
  listRolesForUserInDomain: listRolesForUserInDomainWithEnforcer,
  listRolesForUserInDomains: listRolesForUserInDomainsWithEnforcer,
  listRolesForUser: listRolesForUserWithEnforcer
} = require('./casbinRoleManagement');
/**
 * A global instance of a promise that resolves to a Casbin enforcer. This variable
 * is used to ensure that the initialization of the Casbin enforcer through `initCasbin`
 * function happens only once and is reused throughout the application. It helps in
 * managing the asynchronous nature of the Casbin enforcer setup and ensures that the
 * enforcer is readily available for middleware and other components of the application.
 *
 * @type {Promise<import('casbin').Enforcer> | undefined}
 */
let enforcerPromiseInstance;

/**
 * Keep a reference to the database adapter
 */
let adapter;

/**
 * Asynchronously initializes the Casbin enforcer with a Postgres database adapter,
 * loads policies from a CSV file, and sets up custom evaluation functions. This function
 * sets up the necessary environment for Casbin to enforce authorization policies within
 * the application. It also demonstrates how to add custom functions to Casbin's function map
 * for enhanced policy evaluation capabilities.
 *
 * Ensure that all necessary environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`,
 * `DB_PASSWORD`, and `DB_NAME`) are correctly set before calling this function.
 *
 * Note: The function includes a hardcoded call to `addRoleForUserInDomain` for demonstration
 * purposes and should be adjusted or removed as per your application's requirements.
 *
 * @async
 * @returns {Promise<import('casbin').Enforcer>} A promise that resolves with the initialized Casbin enforcer.
 */
async function initCasbin() {
  adapter = await TypeORMAdapter.newAdapter({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'local-test' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  });

  const enforcer = await newEnforcer('src/config/model.conf', adapter);

  await deletePoliciesForDomainZero(enforcer);

  const policyFilePath = 'src/config/policy.csv';
  await importPoliciesOrRolesFromCSV(enforcer, policyFilePath);

  const roleFilePath = 'src/config/role.csv';
  await importPoliciesOrRolesFromCSV(enforcer, roleFilePath);

  // Add custom functions to Casbin's function map
  await enforcer.addFunction('customeEval', async (r_sub, r_dom, r_obj, r_act, r_attrs, p_sub, p_dom, p_obj, p_act, p_cond, p_attrs) => {
    // Convert Casbin FunctionCall arguments to JavaScript objects
    const request = { sub: r_sub, dom: r_dom, obj: r_obj, act: r_act, attrs: r_attrs };
    const policy = { sub: p_sub, dom: p_dom, obj: p_obj, act: p_act, cond: p_cond, attrs: p_attrs };
    const userType = getUserTypeInDomain(p_sub, p_dom);
    return customeEval(request, policy, userType);
  });

  return enforcer;
}

/**
 * Closes the Casbin adapter's database connection.
 * This function checks if the adapter instance exists and, if so,
 * initiates the closure of its database connection. It's particularly useful
 * during the graceful shutdown of the application or in testing environments
 * where open database connections might prevent clean exits.
 * 
 * Note: This function is async and returns a promise, which resolves
 * once the adapter's connection has been successfully closed.
 * It should be awaited to ensure proper cleanup.
 *
 * @async
 * @function closeCasbinAdapter
 * @returns {Promise<void>} A promise that resolves when the adapter's connection is closed.
 *                          If the adapter is not initialized, the function resolves immediately.
 */
async function closeCasbinAdapter() {
  if (adapter) {
    await adapter.close();
  }
}

/**
 * Initializes the Casbin enforcer as a middleware component asynchronously.
 * If the enforcer has not been initialized, it creates a new instance of the
 * enforcer initialization process and assigns it to `enforcerPromiseInstance`.
 * This setup ensures that Casbin authorization is ready and available for use
 * in the application middleware, preventing repeated initializations.
 *
 * Note: Assumes `enforcerPromiseInstance` is a global or higher-scoped variable
 * accessible within this function's context.
 *
 * @async
 * @function setupCasbinMiddleware
 * @returns {Promise<void>} A promise that resolves when the Casbin enforcer is
 *                          initialized and set. The promise does not return any
 *                          value upon resolution.
 */
async function setupCasbinMiddleware() {
  if (!enforcerPromiseInstance) {
    enforcerPromiseInstance = (async () => {
      return await initCasbin();
    })();
  }
}

/**
 * Middleware for integrating Casbin with Express.js applications. It ensures that
 * the Casbin enforcer is properly initialized and available for request handling.
 * The middleware attaches the Casbin enforcer instance to the request object, allowing
 * subsequent middleware and request handlers to perform authorization checks.
 * If the Casbin enforcer is not initialized, it logs an error and returns a 500
 * Internal Server Error response, indicating that the `setupCasbinMiddleware`
 * needs to be called prior to this middleware's use.
 *
 * @param {import('express').Request} req - The request object provided by Express.js.
 * @param {import('express').Response} res - The response object provided by Express.js.
 * @param {import('express').NextFunction} next - The next function in the middleware chain.
 */
async function casbinMiddleware(req, res, next) {
  try {
    if (!enforcerPromiseInstance) {
      console.error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
      return res.status(500).send('Internal Server Error');
    }

    // Await the enforcer instance from the promise
    const enforcer = await enforcerPromiseInstance;
    req.enforcer = enforcer;
    next();
  } catch (error) {
    next(error); // Pass any errors to the error-handling middleware
  }
}


/**
 * Asynchronously lists roles for a user. This function relies on a globally
 * available `enforcerPromiseInstance` to obtain the Casbin enforcer instance. It's intended for use
 * in contexts where it's necessary to obtain a user's roles without directly
 * handling HTTP response objects.
 *
 * @param {string} username - The username of the user whose roles are to be listed.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of role names associated with the user in the given domain.
 */
async function listRolesForUser(username) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  try {
    const enforcer = await enforcerPromiseInstance;
    const roles = await listRolesForUserWithEnforcer(enforcer, username);
    return roles;
  } catch (error) {
    console.error("Error listing roles for user:", error);
    throw error;
  }
}

/**
 * Asynchronously lists roles for a user within a specific domain. This function relies on a globally
 * available `enforcerPromiseInstance` to obtain the Casbin enforcer instance. It's intended for use
 * in contexts where it's necessary to obtain a user's roles within a specific domain without directly
 * handling HTTP response objects.
 *
 * @param {string} username - The username of the user whose roles are to be listed.
 * @param {string} domain - The domain within which the roles are to be listed.
 * @returns {Promise<Array<string, string>>} A promise that resolves to an array of role names within the passed domain associated for the given username.
 */
async function listRolesForUserInDomain(username, domain) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  try {
    const enforcer = await enforcerPromiseInstance;
    const roles = await listRolesForUserInDomainWithEnforcer(enforcer, username, domain);

    const userRolesDomainArray = roles.map((role) => {
      return { role, domain };
    });

    return userRolesDomainArray;
  } catch (error) {
    console.error("Error listing roles for user:", error);
    throw error;
  }
}

/**
 * Asynchronously lists roles for a user within all domains. This function relies on a globally
 * available `enforcerPromiseInstance` to obtain the Casbin enforcer instance. It's intended for use
 * in contexts where it's necessary to obtain a user's roles within all domains without directly
 * handling HTTP response objects.
 *
 * @param {string} username - The username of the user whose roles are to be listed.
 * @returns {Promise<Array<string, string>>} A promise that resolves to an array of role names within different domains associated for the given username.
 */
async function listRolesForUserInDomains(username) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  try {
    const enforcer = await enforcerPromiseInstance;
    const roles = await listRolesForUserInDomainsWithEnforcer(enforcer, username);
    return roles;
  } catch (error) {
    console.error("Error listing roles for user:", error);
    throw error;
  }
}

/**
 * Determines the user type based on an array of role-domain pairs.
 * 
 * The function classifies users as 'internal', 'customer', 'external', or 'public' based on their roles and the domains those roles are associated with.
 * 
 * - 'internal': If the user has roles such as 'super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', or 'support' in domain 0.
 * - 'customer': If the user has any role in a domain greater than 0, or roles 'admin', 'admindata', 'officer', 'agent' in domain 0.
 * - 'external': If the user has only 'enduser' in domain 0 and no other qualifying roles for 'customer' or 'internal'.
 * - 'public': If the user has 'public' in domain 0 and no other qualifying roles for 'customer', 'internal', or 'external'.
 * 
 * The user type determination prioritizes 'internal', 'customer', and 'external' types over 'public'. If no specific conditions are met, the function returns null.
 *
 * @param {Object[]} rolesDomains - An array of objects, each with a 'role' (string) and 'domain' (number) property.
 * @returns {string|null} The user type ('internal', 'customer', 'external') based on the provided roles and domains, or 'public' if no type can be determined.
 */
function getUserType(rolesDomains) {
  // Define roles associated with each user type
  const customerRoles = ['admin', 'admindata', 'officer', 'agent'];
  const internalRoles = ['super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', 'support'];

  // Flags to determine if the user is external, customer, or internal
  let isExternal = false;
  let isCustomer = false;
  let isInternal = false;

  // Iterate through each role-domain pair
  for (let { role, domain } of rolesDomains) {
    if (typeof domain !== 'number') {
      domain = parseInt(domain, 10);
    }
    if (role === 'enduser' && domain === 0) {
      isExternal = true;
    } else if (domain > 0 || customerRoles.includes(role)) {
      isCustomer = true;
    } else if (internalRoles.includes(role) && domain === 0) {
      isInternal = true;
    }
  }

  // Determine user type based on flags
  // Prioritize 'internal', 'customer', and 'external' types over 'public'
  if (isInternal) {
    return 'internal';
  } else if (isCustomer) {
    return 'customer';
  } else if (isExternal) {
    return 'external';
  }
  return 'public';
}

/**
 * Determines the user type within a specified domain based on their role.
 * 
 * This function classifies users as 'internal', 'customer', 'external', or 'public' by analyzing their role within the given domain:
 * - 'internal': User has roles typically associated with internal staff ('super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', 'support') in domain 0.
 * - 'customer': User has any role in a domain greater than 0, or specific roles ('admin', 'admindata', 'officer', 'agent') in domain 0, indicating they are a customer.
 * - 'external': User has the 'enduser' role in domain 0 without other roles that would classify them as 'customer' or 'internal'.
 * - 'public': User has the 'public' role in domain 0 without other roles that would classify them as 'customer', 'internal', or 'external'.
 * 
 * The function returns 'internal', 'customer', 'external', or 'public' based on the highest priority user type identified. If no specific conditions are met, it returns null.
 *
 * @param {string} role - The role identifier (strings) that the user has.
 * @param {number} domain - The domain identifier to check the role against.
 * @returns {string} The determined user type ('internal', 'customer', 'external') or 'public' if no type can be determined.
 */
function getUserTypeInDomain(role, domain) {
  if (typeof domain !== 'number') {
    domain = parseInt(domain, 10);
  }
  // handel exceptional cases first
  if (domain > 0) {
    return 'customer';
  } else if (domain < 0) {
    return null;
  }
  // Define roles associated with each user type
  const customerRoles = ['admin', 'admindata', 'officer', 'agent'];
  const internalRoles = ['super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', 'support'];

  if (role === 'enduser') {
    return 'external';
  } else if (customerRoles.includes(role)) {
    return 'customer';
  } else if (internalRoles.includes(role)) {
    return 'internal';
  }

  return 'public';
}

/**
 * Asynchronously adds a role to a user within a specific domain. This function relies on the global
 * `enforcerPromiseInstance` to obtain the Casbin enforcer instance. It's designed to be used in various contexts,
 * not limited to Express.js middleware or route handlers.
 * 
 * @param {string} username - The username of the user to whom the role will be added.
 * @param {string} role - The role to be added to the user.
 * @param {string} domain - The domain within which the role is to be added.
 * @returns {Promise<void>} A promise that resolves when the operation is complete. The promise will reject if an error occurs.
 */
async function addRoleForUserInDomain(username, role, domain) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  // Await the promise to get the enforcer instance
  const enforcer = await enforcerPromiseInstance;

  return await addRoleForUserInDomainWithEnforcer(enforcer, username, role, domain);
}

/**
 * Asynchronously removes a role from a user within a specific domain. This function depends on the global
 * `enforcerPromiseInstance` to obtain the Casbin enforcer instance. It's adaptable for use across various
 * contexts, extending beyond just Express.js middleware or route handlers.
 * 
 * @param {string} username - The username of the user from whom the role will be removed.
 * @param {string} role - The role to be removed from the user.
 * @param {string} domain - The domain within which the role is to be removed.
 * @returns {Promise<void>} A promise that resolves when the operation is complete. The promise will reject if an error occurs.
 */
async function removeRoleForUserInDomain(username, role, domain) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  const enforcer = await enforcerPromiseInstance;
  await removeRoleForUserInDomainWithEnforcer(enforcer, username, role, domain);
}

/**
 * Asynchronously removes all roles from a user within a specific domain. This function depends on the global
 * `enforcerPromiseInstance` to obtain the Casbin enforcer instance. It's adaptable for use across various
 * contexts, extending beyond just Express.js middleware or route handlers.
 * 
 * @param {string} username - The username of the user from whom the role will be removed.
 * @param {string?} domain - The domain within which the role is to be removed. If pass null, it will remove user from all domains. 
 * @returns {Promise<void>} A promise that resolves when the operation is complete. The promise will reject if an error occurs.
 */
async function removeRolesForUserInDomain(username, domain) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  const enforcer = await enforcerPromiseInstance;
  await removeRolesForUserInDomainWithEnforcer(enforcer, username, domain);

}

/**
 * Asynchronously removes all roles from a user in all domains. This function depends on the global
 * `enforcerPromiseInstance` to obtain the Casbin enforcer instance. It's adaptable for use across various
 * contexts, extending beyond just Express.js middleware or route handlers.
 * 
 * @param {string} username - The username of the user from whom the role will be removed.
 * @returns {Promise<void>} A promise that resolves when the operation is complete. The promise will reject if an error occurs.
 */
async function removeRolesForUserInAllDomains(username) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  const enforcer = await enforcerPromiseInstance;
  await removeRolesForUserInAllDomainsWithEnforcer(enforcer, username);
}

/**
 * Adds a policy to the specified domain using the Casbin enforcer.
 * 
 * This function asynchronously adds a new access control policy to the Casbin enforcer,
 * which defines whether a subject can perform an action on an object within a specific domain,
 * considering optional conditions and attributes.
 *
 * @param {string} sub - The subject (user/role) the policy applies to.
 * @param {string} dom - The domain/tenant to which the policy belongs.
 * @param {string} obj - The object/resource the policy pertains to.
 * @param {string} act - The action permitted or denied by the policy.
 * @param {string} [cond='none'] - Optional condition for policy enforcement. Defaults to 'none'.
 * @param {Object} [attrs={}] - Optional JSON object of attributes associated with the policy. Defaults to an empty object.
 * @param {string} [eft='allow'] - The effect of the policy ('allow' or 'deny'). Defaults to 'allow'.
 * @returns {Promise<void>} A promise that resolves with no value upon successful addition of the policy.
 * @throws {Error} If the Casbin enforcer instance is not initialized.
 */
async function addPolicyInDomain(sub, dom, obj, act, cond = 'none', attrs = {}, eft = 'allow') {

  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  const attrsStr = typeof attrs === 'object' && attrs !== null ? (Object.keys(attrs).length === 0 ? 'none' : JSON.stringify(attrs)) : attrs;

  if ([sub, dom, obj, act, cond, attrsStr, eft].some(v => typeof v !== 'string' || v === undefined || v === null)) {
    throw new Error('All parameters are mandatory and must be of type string except attrs that can be a JSON object. At least one parameter is missing, null, or not a string.');
  }

  // If no error was thrown, proceed with the policy addition
  const policy = [sub, dom, obj, act, cond, attrsStr, eft];

  const enforcer = await enforcerPromiseInstance;
  await enforcer.addPolicy(...policy);
  await enforcer.savePolicy();
}

/**
 * Retrieves policies within a specific domain based on provided criteria.
 * This function asynchronously fetches policies from a Casbin enforcer,
 * filtering them based on subject, domain, object, action, condition, attributes, and effect.
 * 
 * Attributes are expected as a JSON object but are converted to a string representation
 * for the filtering process. All other parameters must be strings.
 * 
 * @param {string} sub - The subject (user/role) the policy applies to.
 * @param {string} dom - The domain/tenant to which the policy belongs.
 * @param {string} [obj=''] - Optional object/resource the policy pertains to.
 * @param {string} [act=''] - Optional action permitted or denied by the policy.
 * @param {string} [cond=''] - Optional condition for policy enforcement. Defaults to an empty string.
 * @param {Object} [attrs={}] - Optional JSON object of attributes associated with the policy. Defaults to an empty object.
 * @param {string} [eft=''] - The effect of the policy ('allow' or 'deny'). Defaults to an empty string.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered policies matching the criteria.
 * @throws {Error} If the Casbin enforcer instance is not initialized or if any parameter (except `attrs`) is not a string, is missing, or is `null`.
 * @async
 */
async function getPoliciesInDomain(sub, dom, obj = '', act = '', cond = '', attrs = {}, eft = '') {

  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  if (!sub) sub = '';
  if (!obj) obj = '';
  if (!act) act = '';
  if (!cond) cond = '';
  if (!attrs) attrs = '';
  if (!eft) eft = '';

  attrs = typeof attrs === 'object' ? (Object.keys(attrs).length === 0 ? '' : JSON.stringify(attrs)) : attrs;

  if ([sub, dom, obj, act, cond, attrs, eft].some(v => typeof v !== 'string' || v === undefined || v === null)) {
    throw new Error('All parameters are mandatory and must be of type string except attrs that can be a JSON object. At least one parameter is missing, null, or not a string.');
  }

  // If no error was thrown, proceed with the policy addition
  const policy = [sub, dom, obj, act, cond, attrs, eft];

  const enforcer = await enforcerPromiseInstance;
  const policies = await enforcer.getFilteredPolicy(0, ...policy);

  const adjustedPolicies = policies.map(policyArray => ({
    subject: policyArray[0],
    domain: policyArray[1],
    object: policyArray[2],
    action: policyArray[3],
    condition: policyArray[4],
    attributes: policyArray[5],
    effect: policyArray[6],
  }));

  return adjustedPolicies;
}

/**
 * Retrieves roles within a specific domain based on provided criteria.
 * This function asynchronously fetches roles from a Casbin enforcer,
 * filtering them based on subject, domain.
 * 
 * 
 * @param {string} sub - The rolename.
 * @param {string} dom - The domain to which the role belongs.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered roles matching the criteria.
 * @throws {Error} If the Casbin enforcer instance is not initialized or if any parameter is not a string, is missing.
 * @async
 */
async function getRolesInDomain(sub = '', dom) {

  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  if (!sub) sub = '';

  if ([sub, dom].some(v => typeof v !== 'string' || v === undefined || v === null)) {
    throw new Error('All parameters are mandatory and must be of type string. At least one parameter is missing, null, or not a string.');
  }

  const policy = [sub, dom];

  const enforcer = await enforcerPromiseInstance;
  const roles = await enforcer.getFilteredPolicy(0, ...policy);

  const adjustedRoles = roles.map(policyArray => ({
    role: policyArray[0],
    domain: policyArray[1]
  }));

  const uniqueJsonStrings = new Set(adjustedRoles.map(obj => JSON.stringify(obj)));

  const uniqueRoles = Array.from(uniqueJsonStrings).map(jsonStr => JSON.parse(jsonStr));

  return uniqueRoles;
}

/**
 * Retrieves users related to a specific role in a domain based on provided criteria.
 * This function asynchronously fetches users from a Casbin enforcer,
 * filtering them based on role, domain.
 * 
 * 
 * @param {string} sub - The rolename.
 * @param {string} dom - The domain to which the role belongs.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered roles matching the criteria.
 * @throws {Error} If the Casbin enforcer instance is not initialized or if any parameter is not a string, is missing.
 * @async
 */
async function getUsersForRoleInDomain(sub, dom) {

  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  if ([sub, dom].some(v => typeof v !== 'string' || v === undefined || v === null)) {
    throw new Error('All parameters are mandatory and must be of type string. At least one parameter is missing, null, or not a string.');
  }

  const enforcer = await enforcerPromiseInstance;
  const users = await enforcer.getUsersForRoleInDomain(sub, dom);

  return users;
}

/**
 * Remove policies within a specific domain based on provided criteria.
 * This function asynchronously removes policies from a Casbin enforcer,
 * filtering them based on subject, domain, object, action, condition, attributes, and effect.
 * 
 * Attributes are expected as a JSON object but are converted to a string representation
 * for the filtering process. All other parameters must be strings.
 * 
 * @param {string} sub - The subject (user/role) the policy applies to.
 * @param {string} dom - The domain/tenant to which the policy belongs.
 * @param {string} [obj=''] - Optional object/resource the policy pertains to.
 * @param {string} [act=''] - Optional action permitted or denied by the policy.
 * @param {string} [cond=''] - Optional condition for policy enforcement. Defaults to an empty string.
 * @param {Object} [attrs={}] - Optional JSON object of attributes associated with the policy. Defaults to an empty object.
 * @param {string} [eft=''] - The effect of the policy ('allow' or 'deny'). Defaults to an empty string.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered policies matching the criteria.
 * @throws {Error} If the Casbin enforcer instance is not initialized or if any parameter (except `attrs`) is not a string, is missing, or is `null`.
 * @async
 */
async function removePoliciesInDomain(sub, dom, obj = '', act = '', cond = '', attrs = {}, eft = '') {

  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  if (!obj) obj = '';
  if (!act) act = '';
  if (!cond) cond = '';
  if (!attrs) attrs = '';
  if (!eft) eft = '';

  attrs = typeof attrs === 'object' ? (Object.keys(attrs).length === 0 ? '' : JSON.stringify(attrs)) : attrs;

  if ([sub, dom, obj, act, cond, attrs, eft].some(v => typeof v !== 'string' || v === undefined || v === null)) {
    throw new Error('All parameters are mandatory and must be of type string except attrs that can be a JSON object. At least one parameter is missing, null, or not a string.');
  }

  // If no error was thrown, proceed with the policy addition
  const policy = [sub, dom, obj, act, cond, attrs, eft];

  const enforcer = await enforcerPromiseInstance;
  const result = await enforcer.removeFilteredPolicy(0, ...policy);

  return result;
}


module.exports = { setupCasbinMiddleware, casbinMiddleware, addRoleForUserInDomain, removeRoleForUserInDomain, removeRolesForUserInDomain, removeRolesForUserInAllDomains, listRolesForUserInDomain, listRolesForUser, listRolesForUserInDomains, closeCasbinAdapter, getUserType, getUserTypeInDomain, addPolicyInDomain, getPoliciesInDomain, getRolesInDomain, getUsersForRoleInDomain, removePoliciesInDomain };