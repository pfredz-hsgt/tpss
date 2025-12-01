import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// Fridge Sections
export const getFridgeSections = async (req: Request, res: Response) => {
  try {
    const sections = await prisma.fridgeSection.findMany({
      include: {
        fridges: {
          orderBy: { sortOrder: 'asc' },
        },
        picContacts: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(sections);
  } catch (error) {
    console.error('Error fetching fridge sections:', error);
    res.status(500).json({ error: 'Failed to fetch fridge sections' });
  }
};

export const createFridgeSection = async (req: Request, res: Response) => {
  try {
    const { name, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Section name is required' });
    }

    const section = await prisma.fridgeSection.create({
      data: {
        name,
        sortOrder: sortOrder || 0,
      },
      include: {
        fridges: true,
        picContacts: true,
      },
    });

    res.status(201).json(section);
  } catch (error) {
    console.error('Error creating fridge section:', error);
    res.status(500).json({ error: 'Failed to create fridge section' });
  }
};

export const updateFridgeSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;

    const section = await prisma.fridgeSection.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        fridges: true,
        picContacts: true,
      },
    });

    res.json(section);
  } catch (error) {
    console.error('Error updating fridge section:', error);
    res.status(500).json({ error: 'Failed to update fridge section' });
  }
};

export const deleteFridgeSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.fridgeSection.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fridge section:', error);
    res.status(500).json({ error: 'Failed to delete fridge section' });
  }
};

// Fridges
export const createFridge = async (req: Request, res: Response) => {
  try {
    const { sectionId, name, sortOrder } = req.body;

    if (!sectionId || !name) {
      return res.status(400).json({ error: 'Section ID and fridge name are required' });
    }

    const fridge = await prisma.fridge.create({
      data: {
        sectionId,
        name,
        sortOrder: sortOrder || 0,
      },
      include: {
        section: true,
      },
    });

    res.status(201).json(fridge);
  } catch (error) {
    console.error('Error creating fridge:', error);
    res.status(500).json({ error: 'Failed to create fridge' });
  }
};

export const updateFridge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;

    const fridge = await prisma.fridge.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        section: true,
      },
    });

    res.json(fridge);
  } catch (error) {
    console.error('Error updating fridge:', error);
    res.status(500).json({ error: 'Failed to update fridge' });
  }
};

export const deleteFridge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.fridge.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fridge:', error);
    res.status(500).json({ error: 'Failed to delete fridge' });
  }
};

// PIC Contacts
export const createPICContact = async (req: Request, res: Response) => {
  try {
    const { sectionId, name, phoneNumber, sortOrder } = req.body;

    if (!sectionId || !name || !phoneNumber) {
      return res.status(400).json({ error: 'Section ID, name, and phone number are required' });
    }

    const contact = await prisma.pICContact.create({
      data: {
        sectionId,
        name,
        phoneNumber,
        sortOrder: sortOrder || 0,
      },
      include: {
        section: true,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating PIC contact:', error);
    res.status(500).json({ error: 'Failed to create PIC contact' });
  }
};

export const updatePICContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, sortOrder } = req.body;

    const contact = await prisma.pICContact.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        section: true,
      },
    });

    res.json(contact);
  } catch (error) {
    console.error('Error updating PIC contact:', error);
    res.status(500).json({ error: 'Failed to update PIC contact' });
  }
};

export const deletePICContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.pICContact.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PIC contact:', error);
    res.status(500).json({ error: 'Failed to delete PIC contact' });
  }
};

// Temperature Reports
export const createTemperatureReport = async (req: Request, res: Response) => {
  try {
    const { date, time, remarks, entries } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!date || !time || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Date, time, and entries are required' });
    }

    const report = await prisma.temperatureReport.create({
      data: {
        date: new Date(date),
        time,
        remarks: remarks || null,
        submittedBy: userId,
        entries: {
          create: entries.map((entry: any) => ({
            fridgeId: entry.fridgeId,
            temperatureInRange: entry.temperatureInRange,
          })),
        },
      },
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        entries: {
          include: {
            fridge: {
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating temperature report:', error);
    res.status(500).json({ error: 'Failed to create temperature report' });
  }
};

export const getTemperatureReports = async (req: Request, res: Response) => {
  try {
    const { date, startDate, endDate } = req.query;

    const where: any = {};

    if (date) {
      // Filter by specific date
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: targetDate,
        lt: nextDay,
      };
    } else if (startDate && endDate) {
      // Filter by date range
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const reports = await prisma.temperatureReport.findMany({
      where,
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        entries: {
          include: {
            fridge: {
              include: {
                section: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching temperature reports:', error);
    res.status(500).json({ error: 'Failed to fetch temperature reports' });
  }
};

export const getTemperatureReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await prisma.temperatureReport.findUnique({
      where: { id },
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        entries: {
          include: {
            fridge: {
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Temperature report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching temperature report:', error);
    res.status(500).json({ error: 'Failed to fetch temperature report' });
  }
};

export const deleteTemperatureReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.temperatureReport.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting temperature report:', error);
    res.status(500).json({ error: 'Failed to delete temperature report' });
  }
};

