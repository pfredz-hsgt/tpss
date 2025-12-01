import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

const SALT_ROUNDS = 10;

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, fullName, role } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        fullName,
        role: role || 'USER',
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

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Return user data (without password) and tokens
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    res.json({
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      ...user,
      groups: user.groups.map((gu: { group: any }) => gu.group),
    };

    res.json(userData);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

