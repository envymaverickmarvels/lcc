import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import medicineRoutes from './routes/medicines.js';
import pharmacyRoutes from './routes/pharmacies.js';
import orderRoutes from './routes/orders.js';
import prescriptionRoutes from './routes/prescriptions.js';
import pharmacyProfileRoutes from './routes/pharmacy-profile.js';
import inventoryRoutes from './routes/inventory.js';
import pharmacyOrdersRoutes from './routes/pharmacy-orders.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import emergencyRoutes from './routes/emergency.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimit.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', rateLimiter.auth, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/medicines', medicineRoutes);
app.use('/api/v1/pharmacies', pharmacyRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/pharmacy/profile', pharmacyProfileRoutes);
app.use('/api/v1/pharmacy/inventory', inventoryRoutes);
app.use('/api/v1/pharmacy/orders', pharmacyOrdersRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/pharmacy/analytics', analyticsRoutes);
app.use('/api/v1/emergency', emergencyRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
