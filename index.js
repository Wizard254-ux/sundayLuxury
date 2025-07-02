import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import AuthRouter from './routes/auth.js';
import ServiceRouter from './routes/service.js';
import AppointmentRouter from './routes/Appointment.js';
import StatsRouter from './routes/stats.js';
import AdminRouter from './routes/admin.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!MONGO_URI) {
  console.error(' MONGO_URI is not defined in .env');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Routes
app.use('/auth', AuthRouter);
app.use('/services', ServiceRouter);
app.use('/appointments', AppointmentRouter);
app.use('/stats', StatsRouter);
app.use('/admin', AdminRouter);

// Root route
app.get('/', (req, res) => res.send('💆‍♀️ Spa Backend Running...'));

// DB Connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err.message);
    process.exit(1);
  });
