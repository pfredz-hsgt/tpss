import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';
import { NotificationType } from '../generated/prisma/enums';

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, isSticky, isPinned, archived, search, targetDate } = req.query;
    const userId = req.user?.userId;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (isSticky === 'true') {
      where.isSticky = true;
    }

    if (isPinned === 'true') {
      where.isPinned = true;
    }

    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else if (archived === 'false') {
      where.archivedAt = null;
    }

    if (targetDate) {
      const targetDateObj = new Date(targetDate as string);
      const startOfDay = new Date(targetDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.OR = [
        { targetDate: { gte: startOfDay, lte: endOfDay } },
        { targetDate: null },
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        taggedUsers: {
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
        taggedGroups: {
          include: {
            group: {
              include: {
                users: {
                  where: userId ? { userId } : undefined,
                },
              },
            },
          },
        },
        responses: {
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
      orderBy: [
        { isPinned: 'desc' },
        { isSticky: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const announcementsWithTags = announcements.map((announcement) => ({
      ...announcement,
      taggedUsers: announcement.taggedUsers.map((tu: { user: any }) => tu.user),
      taggedGroups: announcement.taggedGroups.map((tg: { group: any }) => tg.group),
    }));

    res.json(announcementsWithTags);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        taggedUsers: {
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
        taggedGroups: {
          include: {
            group: true,
          },
        },
        responses: {
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

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({
      ...announcement,
      taggedUsers: announcement.taggedUsers.map((tu: { user: any }) => tu.user),
      taggedGroups: announcement.taggedGroups.map((tg: { group: any }) => tg.group),
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, categoryId, isSticky, isPinned, targetDate, taggedUserIds, taggedGroupIds } = req.body;

    if (!title || !content || !categoryId) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse targetDate if provided
    let targetDateObj: Date | null = null;
    if (targetDate) {
      targetDateObj = new Date(targetDate);
      if (isNaN(targetDateObj.getTime())) {
        targetDateObj = null;
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        categoryId,
        authorId: req.user.userId,
        isSticky: isSticky || false,
        isPinned: isPinned || false,
        targetDate: targetDateObj,
        taggedUsers: taggedUserIds && taggedUserIds.length > 0 ? {
          create: taggedUserIds.map((userId: string) => ({
            userId,
          })),
        } : undefined,
        taggedGroups: taggedGroupIds && taggedGroupIds.length > 0 ? {
          create: taggedGroupIds.map((groupId: string) => ({
            groupId,
          })),
        } : undefined,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    // Create notifications for tagged users
    if (taggedUserIds && taggedUserIds.length > 0) {
      const notifications = taggedUserIds.map((userId: string) => ({
        userId,
        type: NotificationType.ANNOUNCEMENT,
        title: 'New Announcement',
        message: `You have been tagged in: ${title}`,
        relatedId: announcement.id,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      // Emit socket events for real-time updates
      taggedUserIds.forEach((userId: string) => {
        io.to(`user:${userId}`).emit('notification', {
          type: 'ANNOUNCEMENT',
          title: 'New Announcement',
          message: `You have been tagged in: ${title}`,
        });
      });
    }

    // Create notifications for users in tagged groups
    if (taggedGroupIds && taggedGroupIds.length > 0) {
      const groups = await prisma.group.findMany({
        where: { id: { in: taggedGroupIds } },
        include: { users: true },
      });

      const userIds = new Set<string>();
      groups.forEach((group) => {
        group.users.forEach((gu) => {
          if (gu.userId !== req.user?.userId) {
            userIds.add(gu.userId);
          }
        });
      });

      if (userIds.size > 0) {
        const notifications = Array.from(userIds).map((userId) => ({
          userId,
          type: NotificationType.ANNOUNCEMENT,
          title: 'New Announcement',
          message: `New announcement in your group: ${title}`,
          relatedId: announcement.id,
        }));

        await prisma.notification.createMany({
          data: notifications,
        });

        // Emit socket events
        Array.from(userIds).forEach((userId) => {
          io.to(`user:${userId}`).emit('notification', {
            type: 'ANNOUNCEMENT',
            title: 'New Announcement',
            message: `New announcement in your group: ${title}`,
          });
        });
      }
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, isSticky, isPinned, targetDate, taggedUserIds, taggedGroupIds } = req.body;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Check if user is author or admin
    if (announcement.authorId !== req.user?.userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this announcement' });
    }

    // Parse targetDate if provided
    let targetDateObj: Date | null = null;
    if (targetDate) {
      targetDateObj = new Date(targetDate);
      if (isNaN(targetDateObj.getTime())) {
        targetDateObj = null;
      }
    }

    // Update tagged users
    if (taggedUserIds !== undefined) {
      await prisma.announcementTaggedUser.deleteMany({
        where: { announcementId: id },
      });

      if (taggedUserIds.length > 0) {
        await prisma.announcementTaggedUser.createMany({
          data: taggedUserIds.map((userId: string) => ({
            announcementId: id,
            userId,
          })),
        });
      }
    }

    // Update tagged groups
    if (taggedGroupIds !== undefined) {
      await prisma.announcementTaggedGroup.deleteMany({
        where: { announcementId: id },
      });

      if (taggedGroupIds.length > 0) {
        await prisma.announcementTaggedGroup.createMany({
          data: taggedGroupIds.map((groupId: string) => ({
            announcementId: id,
            groupId,
          })),
        });
      }
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        categoryId,
        isSticky,
        isPinned,
        targetDate: targetDateObj,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const respondToAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Create or update response
    const announcementResponse = await prisma.announcementResponse.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: req.user.userId,
        },
      },
      update: {
        response: response as string,
      },
      create: {
        announcementId: id,
        userId: req.user.userId,
        response: response as string,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    res.json(announcementResponse);
  } catch (error) {
    console.error('Respond to announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const archiveAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only admins can archive announcements
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to archive announcements' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Archive announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Only admins can delete announcements
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to delete announcements' });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
