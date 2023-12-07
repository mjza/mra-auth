const app = require('./app');
const db = require('./db/database');

// running the server 
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    await db.closePool();
    console.log('Database pool closed');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
};

// For nodemon restarts
process.once('SIGUSR2', async () => {
  await gracefulShutdown();
  process.kill(process.pid, 'SIGUSR2');
});

// For app termination
process.on('SIGINT', async () => {
  await gracefulShutdown();
});

// For Heroku app termination
process.on('SIGTERM', async () => {
  await gracefulShutdown();
});

module.exports = server;