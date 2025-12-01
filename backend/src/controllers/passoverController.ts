import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../index';
import { NotificationType, PassoverStatus } from '../generated/prisma/enums';

export const getPassovers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, categoryId, outgoingUserId, incomingUserId } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as PassoverStatus;
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (outgoingUserId) {
      where.outgoingUserId = outgoingUserId as string;
    }

    if (incomingUserId) {
      where.incomingUserId = incomingUserId as string;
    }

    // Exclude archived passovers by default
    where.archivedAt = null;

    // Filter passovers to only show those relevant to the current user
    if (req.user) {
      const userId = req.user.userId;
      
      // Get user's groups
      const userGroups = await prisma.groupUser.findMany({
        where: { userId },
        select: { groupId: true },
      });
      const userGroupIds = userGroups.map((ug: { groupId: string }) => ug.groupId);

      // Show passovers where:
      // 1. User is the outgoing user (they created it)
      // 2. User is the incoming user (direct passover to them)
      // 3. User is in the group that the passover is targeted to
      where.OR = [
        { outgoingUserId: userId },
        { incomingUserId: userId },
        ...(userGroupIds.length > 0 ? [{ groupId: { in: userGroupIds } }] : []),
      ];
    }

    const passovers = await prisma.passover.findMany({
      where,
      include: {
        outgoingUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        incomingUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        group: {
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
        },
        category: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(passovers);
  } catch (error) {
    console.error('Get passovers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPassover = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const passover = await prisma.passover.findUnique({
      where: { id },
      include: {
        outgoingUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        incomingUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        category: true,
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

    if (!passover) {
      return res.status(404).json({ error: 'Passover not found' });
    }

    res.json(passover);
  } catch (error) {
    console.error('Get passover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPassover = async (req: AuthRequest, res: Response) => {
  try {
    const { incomingUserId, groupId, categoryId, content, attachments } = req.body;

    // Either incomingUserId or groupId must be provided (but not both)
    if ((!incomingUserId && !groupId) || (incomingUserId && groupId)) {
      return res.status(400).json({ error: 'Either incoming user or group must be specified (but not both)' });
    }

    if (!categoryId || !content) {
      return res.status(400).json({ error: 'Category and content are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Store content as JSON - if it's a string, wrap it in an object
    const contentData = typeof content === 'string' ? { text: content } : content;

    const passover = await prisma.passover.create({
      data: {
        outgoingUserId: req.user.userId,
        incomingUserId: incomingUserId || null,
        groupId: groupId || null,
        categoryId,
        content: contentData,
        attachments: attachments || null,
        status: PassoverStatus.PENDING,
      },
      include: {
        outgoingUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        incomingUser: incomingUserId ? {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        } : undefined,
        group: groupId ? {
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
        } : undefined,
        category: true,
      },
    });

    // Create notifications
    if (incomingUserId) {
      // Single user notification (legacy mode)
      await prisma.notification.create({
        data: {
          userId: incomingUserId,
          type: NotificationType.PASSOVER,
          title: 'New Passover Handover',
          message: `You have a new passover from ${passover.outgoingUser.fullName}`,
          relatedId: passover.id,
        },
      });

      // Emit socket event
      io.to(`user:${incomingUserId}`).emit('notification', {
        type: 'PASSOVER',
        title: 'New Passover Handover',
        message: `You have a new passover from ${passover.outgoingUser.fullName}`,
        passoverId: passover.id,
      });
    } else if (groupId && passover.group && 'users' in passover.group) {
      // Group notification - notify all users in the group
      const groupUsers = (passover.group as any).users.map((gu: any) => gu.user);
      
      // Create notifications for all users in the group
      const notifications = groupUsers.map((user: any) => ({
        userId: user.id,
        type: NotificationType.PASSOVER,
        title: 'New Passover Handover',
        message: `You have a new passover from ${passover.outgoingUser.fullName}`,
        relatedId: passover.id,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      // Emit socket events to all users in the group
      groupUsers.forEach((user: any) => {
        io.to(`user:${user.id}`).emit('notification', {
          type: 'PASSOVER',
          title: 'New Passover Handover',
          message: `You have a new passover from ${passover.outgoingUser.fullName}`,
          passoverId: passover.id,
        });
      });
    }

    res.status(201).json(passover);
  } catch (error) {
    console.error('Create passover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const acknowledgePassover = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const passover = await prisma.passover.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!passover) {
      return res.status(404).json({ error: 'Passover not found' });
    }

    // Check if user is authorized to acknowledge
    let canAcknowledge = false;
    if (passover.incomingUserId === req.user.userId) {
      canAcknowledge = true;
    } else if (passover.groupId && passover.group) {
      // For group-based passovers, any user in the group can acknowledge
      const groupUserIds = (passover.group as any).users.map((gu: any) => gu.userId);
      canAcknowledge = groupUserIds.includes(req.user.userId);
    }

    if (!canAcknowledge) {
      return res.status(403).json({ error: 'Only the incoming user or group members can acknowledge this passover' });
    }

    const updated = await prisma.passover.update({
      where: { id },
      data: {
        status: PassoverStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
      },
      include: {
        outgoingUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        incomingUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        category: true,
      },
    });

    // Get the acknowledging user's info
    const acknowledgingUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { fullName: true },
    });

    // Notify outgoing user
    await prisma.notification.create({
      data: {
        userId: passover.outgoingUserId,
        type: NotificationType.PASSOVER,
        title: 'Passover Acknowledged',
        message: `${acknowledgingUser?.fullName || 'A user'} has acknowledged your passover`,
        relatedId: passover.id,
      },
    });

    io.to(`user:${passover.outgoingUserId}`).emit('notification', {
      type: 'PASSOVER',
      title: 'Passover Acknowledged',
      message: `${acknowledgingUser?.fullName || 'A user'} has acknowledged your passover`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Acknowledge passover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const respondToPassover = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || typeof response !== 'string') {
      return res.status(400).json({ error: 'Response text is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const passover = await prisma.passover.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!passover) {
      return res.status(404).json({ error: 'Passover not found' });
    }

    // Check if user is authorized to respond
    let canRespond = false;
    if (passover.incomingUserId === req.user.userId) {
      canRespond = true;
    } else if (passover.groupId && passover.group) {
      // For group-based passovers, any user in the group can respond
      const groupUserIds = (passover.group as any).users.map((gu: any) => gu.userId);
      canRespond = groupUserIds.includes(req.user.userId);
    }

    if (!canRespond) {
      return res.status(403).json({ error: 'Only the incoming user or group members can respond to this passover' });
    }

    // Create or update response - store as JSON with text and timestamp
    const passoverResponse = await prisma.passoverResponse.upsert({
      where: {
        passoverId_userId: {
          passoverId: id,
          userId: req.user.userId,
        },
      },
      update: {
        response: {
          text: response,
          timestamp: new Date().toISOString(),
        },
      },
      create: {
        passoverId: id,
        userId: req.user.userId,
        response: {
          text: response,
          timestamp: new Date().toISOString(),
        },
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

    res.json(passoverResponse);
  } catch (error) {
    console.error('Respond to passover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const archivePassover = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const passover = await prisma.passover.findUnique({
      where: { id },
    });

    if (!passover) {
      return res.status(404).json({ error: 'Passover not found' });
    }

    // Only admins can archive passovers
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to archive passovers' });
    }

    const updated = await prisma.passover.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Archive passover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePassover = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const passover = await prisma.passover.findUnique({
      where: { id },
    });

    if (!passover) {
      return res.status(404).json({ error: 'Passover not found' });
    }

    // Only admins can delete passovers
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to delete passovers' });
    }

    await prisma.passover.delete({
      where: { id },
    });

    res.json({ message: 'Passover deleted successfully' });
  } catch (error) {
    console.error('Delete passover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Return file information
    const fileInfo = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
    }));

    res.json({ files: fileInfo });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

