import { Router } from 'express';
import {
  getPassovers,
  getPassover,
  createPassover,
  acknowledgePassover,
  respondToPassover,
  archivePassover,
  deletePassover,
  uploadFiles,
} from '../controllers/passoverController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getPassovers);
router.get('/:id', getPassover);
router.post('/', createPassover);
router.post('/upload', upload.array('files', 10), uploadFiles); // Allow up to 10 files
router.post('/:id/acknowledge', acknowledgePassover);
router.post('/:id/respond', respondToPassover);
router.post('/:id/archive', archivePassover);
router.delete('/:id', deletePassover);

export default router;

