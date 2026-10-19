import mongoose from 'mongoose';
import app from './app';
import { config } from './config/env';

async function start(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
