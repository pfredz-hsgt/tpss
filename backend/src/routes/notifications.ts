import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;

