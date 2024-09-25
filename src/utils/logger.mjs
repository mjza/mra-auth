import { insertAuditLog, updateAuditLog } from './database.mjs';
import { convertRequestData } from './converters.mjs';
import { extractUserDataFromAuthToke } from './generators.mjs';

/**
 * Creates an event log entry in the database based on the incoming request.
 * Gathers necessary information like method, route, IP address, and user info from the request.
 *
 * @param {object} req - The Express request object.
 * @returns {number} The ID of the created log entry, or 0 in case of failure.
 */
const createEventLog = async (req) => {
    try {
        const methodRoute = req.method + ":" + (req.headers.path ? req.headers.path : req.url);
        const reqJson = convertRequestData(req);
        const ipAddress = req.ip || req.connection.remoteAddress; // Gets the IP address of the user
        // Get the token from the request header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN 
        const user = extractUserDataFromAuthToke(token);
        const log = { methodRoute, req: reqJson, ipAddress, userId: (user ? user.userId : null) };
        const res = await insertAuditLog(log);
        return res.log_id
    } catch(err) {
        console.error(err);
        return 0;
    }
};

/**
 * Records an error log in the database for a specific request.
 * Useful for tracking errors that occur during the request lifecycle.
 *
 * @param {object} req - The Express request object.
 * @param {string} comments - Additional comments or error information.
 * @returns {string|null} The updated comments of the log entry, or null in case of failure.
 */
const updateEventLog = async (req, comments) => {
    try {
        if (isNaN(req.logId) || req.logId <= 0){
            return null;
        }
        const log = { logId: req.logId, comments: typeof comments === 'string' ? comments : JSON.stringify(comments, Object.getOwnPropertyNames(comments), 4) };
        const res = await updateAuditLog(log);
        return res.comments;
    } catch(err) {
        console.error(err);
        return null;
    }
};

/**
 * Middleware function to create an audit log for each request.
 * Captures request details and logs them into the database.
 * Adds a 'logId' property to the request object for further reference in the request lifecycle.
 *
 * @param {object} req - The Express request object.
 * @param {object} _ - The Express response object.
 * @param {function} next - The next middleware function in the Express stack.
 */
const auditLogMiddleware = async (req, _, next) => {
    try {
        const logId = await createEventLog(req);
        req.logId = logId;
        next();
    } catch (err) {
        console.error(err);
        next();
    }
};

// Default export for auditLogMiddleware
export default auditLogMiddleware;

// Named exports for createEventLog and updateEventLog
const _createEventLog = createEventLog;
export { _createEventLog as createEventLog };
const _updateEventLog = updateEventLog;
export { _updateEventLog as updateEventLog };