import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getFridgeSections,
  createFridgeSection,
  updateFridgeSection,
  deleteFridgeSection,
  createFridge,
  updateFridge,
  deleteFridge,
  createPICContact,
  updatePICContact,
  deletePICContact,
  createTemperatureReport,
  getTemperatureReports,
  getTemperatureReport,
  deleteTemperatureReport,
} from '../controllers/temperatureController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Fridge Sections
router.get('/sections', getFridgeSections);
router.post('/sections', createFridgeSection);
router.put('/sections/:id', updateFridgeSection);
router.delete('/sections/:id', deleteFridgeSection);

// Fridges
router.post('/fridges', createFridge);
router.put('/fridges/:id', updateFridge);
router.delete('/fridges/:id', deleteFridge);

// PIC Contacts
router.post('/pic-contacts', createPICContact);
router.put('/pic-contacts/:id', updatePICContact);
router.delete('/pic-contacts/:id', deletePICContact);

// Temperature Reports
router.get('/reports', getTemperatureReports);
router.get('/reports/:id', getTemperatureReport);
router.post('/reports', createTemperatureReport);
router.delete('/reports/:id', deleteTemperatureReport);

export default router;

