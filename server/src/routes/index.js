import { Router } from 'express';
import authRoutes from './auth.routes.js';
import songRoutes from './songs.routes.js';
import videoRoutes from './videos.routes.js';
import galleryRoutes from './gallery.routes.js';
import eventRoutes from './events.routes.js';
import newsRoutes from './news.routes.js';
import socialRoutes from './socialLinks.routes.js';
import messageRoutes from './messages.routes.js';
import settingsRoutes from './settings.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import paymentRoutes from './payments.routes.js';
import adminRoutes from './admin.routes.js';
import userRoutes from './users.routes.js';
import interactionRoutes from './interactions.routes.js';

const router = Router();

router.get('/', (req, res) => res.json({ success: true, name: 'Denis Ndayishimiye API', version: '1.0.0' }));

router.use('/auth', authRoutes);
router.use('/songs', songRoutes);
router.use('/videos', videoRoutes);
router.use('/gallery', galleryRoutes);
router.use('/events', eventRoutes);
router.use('/news', newsRoutes);
router.use('/social-links', socialRoutes);
router.use('/messages', messageRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/', interactionRoutes);

export default router;
