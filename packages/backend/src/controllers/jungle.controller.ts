import * as jungleService from '../services/jungle.service.js';

import type { Request, Response } from 'express';
import type UUID from '../typings/uuid.js';
import type JungleSchema from '../typings/jungleSchemea.js';

export const create = async (req: Request, res: Response) => {
    const { url, planted_by_user_id } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const newJungle = await jungleService.create(url, planted_by_user_id);
    return res.status(201).json(newJungle);
};

export const getById = async (req: Request, res: Response) => {
    const id: UUID | null = req.params.id as UUID || null;
    const jungle = await jungleService.getByIdOrUrl(id, null);
    if (!jungle) return res.status(404).json({ error: 'Jungle not found' });
    return res.status(200).json(jungle);
};

export const getByUrl = async (req: Request, res: Response) => {
    const url: string | null = req.params.url as string || null;
    const jungle = await jungleService.getByIdOrUrl(null, url);
    if (!jungle) return res.status(404).json({ error: 'Jungle not found' });
    return res.status(200).json(jungle);
};

export const update = async (req: Request, res: Response) => {
    const id: UUID | null = req.params.id as UUID || null;
    if (!id) return res.status(400).json({ error: 'Jungle id is required for update' });
    const updateData: JungleSchema = req.body as JungleSchema;
    const updatedJungle = await jungleService.update(id, updateData);
    if (!updatedJungle) return res.status(404).json({ error: 'Jungle not found' });
    return res.status(200).json(updatedJungle);
};

export const deforrest = async (req: Request, res: Response) => {
    const id: UUID | null = req.params.id as UUID || null;
    if (!id) return res.status(400).json({ error: 'Jungle id is required for deforresting' });
    const deletedJungle = await jungleService.deforrest(id);
    if (!deletedJungle) return res.status(404).json({ error: 'Jungle not found' });
    return res.status(200).json(deletedJungle);
};