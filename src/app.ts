import express, { Express } from 'express';
import userRoutes from './routes/userRoutes';
import sessionRoutes from './routes/sessionRoutes';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
