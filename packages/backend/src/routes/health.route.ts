import { Router } from "express";

const health = Router();

health.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default health;