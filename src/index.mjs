import './config/config.mjs'; // This line must be before the app.mjs import
import { closeApp, createApp } from './app.mjs';

/**
 * A reference to the HTTP server created by Express. This variable is used
 * to store the server instance returned by the `app.listen` method, allowing
 * for operations such as shutting down the server programmatically.
 * 
 * @type {http.Server|null}
 */
let server = null;

/**
 * Starts the server by initializing the application and listening on a specified port.
 * This function asynchronously sets up the application by calling `createApp`, which
 * configures the Express app with all the necessary routes, middleware, and any additional
 * setup required. Once the app is initialized, it listens on the port defined by the
 * `PORT` environment variable, defaulting to 3000 if not specified.
 * 
 * The server instance is globally accessible within the module that defines this function,
 * allowing for further actions such as graceful shutdown or integration with testing frameworks.
 *
 * @async
 * @function startServer
 * @returns {Promise<void>} The function does not explicitly return a value but resolves
 *                          once the server has been started successfully. Any errors
 *                          during the startup process are caught and logged, and would
 *                          need to be handled by attaching a `.catch` handler when calling
 *                          this function.
 */
const startServer = async () => {
  const app = await createApp();
  const port = process.env.PORT || 3000;
  server = app.listen(port, () => console.log(`Server running on port ${port}`));
};

startServer().catch(err => console.error('Error starting server:', err));

/**
 * Gracefully shuts down the server and closes all associated resources.
 * This function is designed to ensure a smooth shutdown process, allowing
 * the server to complete handling current requests and closing database
 * connections or other resources by calling `closeApp()`. It's particularly
 * important for preventing data loss and ensuring that the application
 * can be restarted without issues. In case of an error during shutdown,
 * it logs the error and exits the process with a non-zero status code.
 * 
 * @async
 * @function gracefulShutdown
 * @returns {Promise<void>} A promise that resolves once all operations
 *                          necessary for shutting down the application
 *                          have completed.
 */
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    closeApp();

    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });

  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
};

/**
 * Handles the SIGUSR2 signal, typically sent by tools like nodemon to
 * indicate a restart request. It ensures the application shuts down
 * gracefully before allowing nodemon to restart the process. This handler
 * is crucial for development environments, allowing developers to quickly
 * restart the application without manually stopping and starting the server.
 */
process.once('SIGUSR2', async () => {
  await gracefulShutdown();
  process.kill(process.pid, 'SIGUSR2');
});

/**
 * Handles the SIGINT signal, which is commonly sent by pressing Ctrl+C in
 * the terminal. This signal handler ensures that the application shuts down
 * gracefully, closing all resources and the server properly before exiting.
 * This is important for running the application in containers or in a
 * local development environment.
 */
process.on('SIGINT', async () => {
  await gracefulShutdown();
});

/**
 * Handles the SIGTERM signal, which is used by services like Heroku to
 * signal the application to terminate. This handler ensures that the
 * application shuts down gracefully, completing any ongoing requests and
 * closing resources properly before exiting. This is essential for
 * applications running in cloud environments where the platform controls
 * the lifecycle of the application instances.
 */
process.on('SIGTERM', async () => {
  await gracefulShutdown();
});

export default server;