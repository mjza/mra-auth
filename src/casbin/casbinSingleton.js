const { newEnforcer } = require('casbin');
const TypeORMAdapter = require('typeorm-adapter').default;
const { customeEval } = require('./casbinEvaluation');
const {
  deletePoliciesForDomainZero,
  importPoliciesFromCSV,
  addRoleForUserInDomain: addRoleForUserInDomainWithEnforcer,
  removeRoleForUserInDomain: removeRoleForUserInDomainWithEnforcer,
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
    ssl: process.env.NODE_ENV !== 'development' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  });

  const enforcer = await newEnforcer('src/config/model.conf', adapter);

  await deletePoliciesForDomainZero(enforcer);

  const csvFilePath = 'src/config/policy.csv';
  await importPoliciesFromCSV(enforcer, csvFilePath);

  // Add custom functions to Casbin's function map
  await enforcer.addFunction('customeEval', async (r_sub, r_dom, r_obj, r_act, r_attrs, p_sub, p_dom, p_obj, p_act, p_cond, p_attrs) => {
    // Convert Casbin FunctionCall arguments to JavaScript objects
    const request = { sub: r_sub, dom: r_dom, obj: r_obj, act: r_act, attrs: r_attrs };
    const policy = { sub: p_sub, dom: p_dom, obj: p_obj, act: p_act, cond: p_cond, attrs: p_attrs };
    const userType = getUserTypeInDomain(p_sub, p_dom);
    return customeEval(request, policy, userType);
  });

  await addRoleForUserInDomainWithEnforcer(enforcer, 'public', 'public', '0'); // For public users

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
function casbinMiddleware(req, res, next) {
  if (!enforcerPromiseInstance) {
    console.error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
    return res.status(500).send('Internal Server Error');
  }

  enforcerPromiseInstance.then(enforcer => {
    req.enforcer = enforcer;
    next();
  }).catch(next);
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
 * @returns {Promise<Array<string>>} A promise that resolves to an array of role names associated with the user in the given domain.
 */
async function listRolesForUserInDomain(username, domain) {
  if (!enforcerPromiseInstance) {
    throw new Error('Casbin enforcer is not initialized. Call setupCasbinMiddleware before using this method.');
  }

  try {
    const enforcer = await enforcerPromiseInstance;
    const roles = await listRolesForUserInDomainWithEnforcer(enforcer, username, domain);
    return roles;
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
 * @returns {string|null} The user type ('internal', 'customer', 'external', 'public') based on the provided roles and domains, or null if no type can be determined.
 */
function getUserType(rolesDomains) {
  // Define roles associated with each user type
  const customerRoles = ['admin', 'admindata', 'officer', 'agent'];
  const internalRoles = ['super', 'superdata', 'devhead', 'developer', 'saleshead', 'sales', 'support'];

  // Flags to determine if the user is external, customer, or internal
  let isPublic = false;
  let isExternal = false;
  let isCustomer = false;
  let isInternal = false;

  // Iterate through each role-domain pair
  for (let { role, domain } of rolesDomains) {
    if(typeof domain !== 'number'){
      domain = parseInt(domain, 10);
    }
    if (role === 'public' && domain === 0) {
      isPublic = true;
    } else if (role === 'enduser' && domain === 0) {
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
  } else if (isPublic) {
    return 'public';
  }

  return null;
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
 * @returns {string} The determined user type ('internal', 'customer', 'external', 'public') or null if no type can be determined.
 */
function getUserTypeInDomain(role, domain) {
  if(typeof domain !== 'number'){
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

  if (role === 'public') {
    return 'public';
  } else if (role === 'enduser') {
    return 'external';
  } else if (customerRoles.includes(role)) {
    return 'customer';
  } else if (internalRoles.includes(role)) {
    return 'internal';
  }

  return null;
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

  return enforcerPromiseInstance.then(enforcer => {
    return addRoleForUserInDomainWithEnforcer(enforcer, username, role, domain);
  });
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

  return enforcerPromiseInstance.then(enforcer => {
    return removeRoleForUserInDomainWithEnforcer(enforcer, username, role, domain);
  });
}

module.exports = { setupCasbinMiddleware, casbinMiddleware, addRoleForUserInDomain, removeRoleForUserInDomain, listRolesForUserInDomain, listRolesForUser, listRolesForUserInDomains, closeCasbinAdapter, getUserType, getUserTypeInDomain };