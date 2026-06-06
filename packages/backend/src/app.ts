import express from 'express';
import cors from 'cors';

import auth from './routes/auth.route.js';

const app = express();

app.use(cors({
  origin: [`chrome-extension://${process.env.EXTENSION_ID}`, 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

app.use('/auth/*', auth);

export default app;