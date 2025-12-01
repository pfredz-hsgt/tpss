import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  respondToAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.post('/:id/respond', respondToAnnouncement);
router.post('/:id/archive', archiveAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;

