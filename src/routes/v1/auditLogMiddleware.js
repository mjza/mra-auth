const { createEventLog } = require('../../utils/logger');

/**
 * Middleware function to create an audit log for each request.
 * Captures request details and logs them into the database.
 * Adds a 'logId' property to the request object for further reference in the request lifecycle.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function in the Express stack.
 */
const auditLogMiddleware = async (req, res, next) => {
    try {
        const logId = await createEventLog(req);
        req.logId = logId;
        next();
    } catch (err) {
        console.error(err);
        next();
    }
};

module.exports = { auditLogMiddleware };
