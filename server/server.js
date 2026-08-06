import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './src/routes/index.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import { seedAdmin } from './src/seed/admin.js';

const app = express();

// Render / Railway sit behind a proxy, so trust it for secure cookies & IPs.
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests without an Origin header (curl, health checks, same-origin).
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global API limiter.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Health check (used by Render / Railway uptime probes).
app.get('/health', (req, res) => res.json({ success: true, status: 'ok', service: 'denis-ndayishimiye-api', uptime: process.uptime() }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

function bootstrap() {
  // Start serving immediately. A missing or unreachable Supabase project must
  // not prevent the frontend from reaching the API or health endpoint.
  app.listen(PORT, () => {
    console.log('----------------------------------------------');
    console.log(`  Denis Ndayishimiye API is live`);
    console.log(`  http://localhost:${PORT}/health`);
    console.log('----------------------------------------------');
  });

  seedAdmin().catch((err) => {
    console.error('[bootstrap] Admin seeding failed:', err.message);
    console.error('[bootstrap] Configure Supabase before using data or admin features.');
  });
}

bootstrap();

export default app;
