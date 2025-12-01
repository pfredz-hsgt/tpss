import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes require authentication but not admin role
router.use(authenticate);

// Get categories (read-only, available to all authenticated users)
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get templates (read-only, available to all authenticated users)
router.get('/templates', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users (read-only, available to all authenticated users - needed for passover creation)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get groups (read-only, available to all authenticated users - needed for passover creation)
router.get('/groups', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const groupsWithUsers = groups.map((group) => ({
      ...group,
      users: group.users.map((gu: { user: any }) => gu.user),
    }));

    res.json(groupsWithUsers);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

