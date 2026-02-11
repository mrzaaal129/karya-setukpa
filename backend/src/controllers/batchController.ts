import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const createBatch = async (req: Request, res: Response) => {
    try {
        console.log('📝 Creating batch with data:', req.body);
        const { name, startDate, endDate } = req.body;

        const batch = await prisma.batch.create({
            data: {
                id: crypto.randomUUID(),
                name,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isActive: true,
                updatedAt: new Date()
            }
        });

        console.log('✅ Batch created successfully:', batch.id);
        res.status(201).json(batch);
    } catch (error) {
        console.error('❌ Error creating batch:');
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({ error: 'Failed to create batch', details: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const getBatches = async (req: Request, res: Response) => {
    try {
        const batches = await prisma.batch.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                _count: {
                    select: { User: true }
                }
            }
        });

        res.json({ batches });
    } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
};

export const updateBatchStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const batch = await prisma.batch.update({
            where: { id },
            data: { isActive, updatedAt: new Date() }
        });

        res.json(batch);
    } catch (error) {
        console.error('Error updating batch status:', error);
        res.status(500).json({ error: 'Failed to update batch status' });
    }
};

export const updateBatch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate, isActive } = req.body;

        const updateData: any = {
            updatedAt: new Date()
        };

        if (name) updateData.name = name;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (isActive !== undefined) updateData.isActive = isActive;

        const batch = await prisma.batch.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: { User: true }
                }
            }
        });

        res.json(batch);
    } catch (error) {
        console.error('Error updating batch:', error);
        res.status(500).json({ error: 'Failed to update batch' });
    }
};

export const deleteBatch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if batch has students
        const studentCount = await prisma.user.count({
            where: { batchId: id }
        });

        if (studentCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete batch',
                message: `This batch has ${studentCount} students. Please reassign or delete students first.`
            });
        }

        // Check if batch exists
        const existingBatch = await prisma.batch.findUnique({
            where: { id }
        });

        if (!existingBatch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        await prisma.batch.delete({
            where: { id }
        });

        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({ error: 'Failed to delete batch' });
    }
};
