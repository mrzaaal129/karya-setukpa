import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import crypto from 'crypto';

export const getAllTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const templates = await prisma.paperTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json({ templates });
    } catch (error) {
        console.error('Get all templates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const template = await prisma.paperTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.json({ template });
    } catch (error) {
        console.error('Get template by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, settings, pages } = req.body;

        if (!name || description === undefined || !settings || !pages) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const template = await prisma.paperTemplate.create({
            data: {
                id: crypto.randomUUID(),
                name,
                description,
                settings,
                pages,
                updatedAt: new Date()
            },
        });

        res.status(201).json({ template });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, settings, pages } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (settings) updateData.settings = settings;
        if (pages) updateData.pages = pages;

        const template = await prisma.paperTemplate.update({
            where: { id },
            data: updateData,
        });

        res.json({ template });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.paperTemplate.delete({
            where: { id },
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
