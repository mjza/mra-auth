const { newEnforcer } = require('casbin');
const TypeORMAdapter = require('typeorm-adapter').default;
const { customeEval } = require('./casbinEvaluation');
const { deletePoliciesForDomainZero, importPoliciesFromCSV, addRoleForUserInDomain } = require('./casbinRoleManagement');

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
  const adapter = await TypeORMAdapter.newAdapter({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const enforcer = await newEnforcer('./config/model.conf', adapter);

  await deletePoliciesForDomainZero(enforcer);

  const csvFilePath = './config/policy.csv';
  await importPoliciesFromCSV(enforcer, csvFilePath);

  // Add custom functions to Casbin's function map
  enforcer.addFunction('customeEval', (r_sub, r_dom, r_obj, r_act, r_attrs, p_sub, p_dom, p_obj, p_act, p_cond, p_attrs) => {
    // Convert Casbin FunctionCall arguments to JavaScript objects
    const request = {sub: r_sub, dom: r_dom, obj: r_obj, act: r_act, attrs: r_attrs};
    const policy = {sub: p_sub, dom: p_dom, obj: p_obj, act: p_act, cond: p_cond, attrs: p_attrs};
    return customeEval(request, policy);
  });

  await addRoleForUserInDomain(enforcer, 'username1', 'admin', '0'); // TODO remove it.
  await addRoleForUserInDomain(enforcer, 'username1', 'enduser', '0'); // TODO remove it.

  return enforcer;
}

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

module.exports = { setupCasbinMiddleware, casbinMiddleware };