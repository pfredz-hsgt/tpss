import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// User Management
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        groups: {
          include: {
            group: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const usersWithGroups = users.map((user) => ({
      ...user,
      groups: user.groups.map((gu: { group: any }) => gu.group),
    }));

    res.json(usersWithGroups);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, fullName, role, groupIds } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        fullName,
        role: role || 'USER',
        groups: groupIds && groupIds.length > 0 ? {
          create: groupIds.map((groupId: string) => ({
            groupId,
          })),
        } : undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, role, groupIds } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { groups: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update groups if provided
    if (groupIds !== undefined) {
      await prisma.groupUser.deleteMany({
        where: { userId: id },
      });

      if (groupIds.length > 0) {
        await prisma.groupUser.createMany({
          data: groupIds.map((groupId: string) => ({
            userId: id,
            groupId,
          })),
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username,
        email,
        fullName,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    res.json({
      ...updatedUser,
      groups: updatedUser.groups.map((gu: { group: any }) => gu.group),
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Group Management
export const getGroups = async (req: AuthRequest, res: Response) => {
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
      orderBy: { createdAt: 'desc' },
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
};

export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, userIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        users: userIds && userIds.length > 0 ? {
          create: userIds.map((userId: string) => ({
            userId,
          })),
        } : undefined,
      },
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
    });

    res.status(201).json({
      ...group,
      users: group.users.map((gu: { user: any }) => gu.user),
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, userIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Update users if provided
    if (userIds !== undefined) {
      await prisma.groupUser.deleteMany({
        where: { groupId: id },
      });

      if (userIds.length > 0) {
        await prisma.groupUser.createMany({
          data: userIds.map((userId: string) => ({
            groupId: id,
            userId,
          })),
        });
      }
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
      },
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
    });

    res.json({
      ...group,
      users: group.users.map((gu: { user: any }) => gu.user),
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.group.delete({
      where: { id },
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Category Management
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, color, icon } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        color,
        icon,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, color, icon } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        color,
        icon,
      },
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Template Management
export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
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
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, name, questions, isActive } = req.body;

    if (!categoryId || !name || !questions) {
      return res.status(400).json({ error: 'Category, name, and content are required' });
    }

    // Store content as string (questions field can store string or JSON)
    const content = typeof questions === 'string' ? questions : JSON.stringify(questions);

    const template = await prisma.template.create({
      data: {
        categoryId,
        name,
        questions: content,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryId, name, questions, isActive } = req.body;

    // Store content as string (questions field can store string or JSON)
    const content = typeof questions === 'string' ? questions : JSON.stringify(questions);

    const template = await prisma.template.update({
      where: { id },
      data: {
        categoryId,
        name,
        questions: content,
        isActive,
      },
      include: {
        category: true,
      },
    });

    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.template.delete({
      where: { id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

