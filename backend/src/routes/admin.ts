import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Group Management
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.put('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);

// Category Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Template Management
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

export default router;

