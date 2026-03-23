import app from './app.js';
import { config } from './config/env.js';
import { redis } from './config/redis.js';
import prisma from './config/database.js';

async function startServer() {
  try {
    await redis.connect();
    console.log('Redis connected');
    
    await prisma.$connect();
    console.log('Database connected');
    
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
