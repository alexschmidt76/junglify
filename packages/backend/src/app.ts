import express from 'express';
import cors from 'cors';

import auth from './routes/auth.route.js';
import health from './routes/health.route.js';
import errorHandler from './middleware/error.middleware.js';
import jungle from './routes/jungle.route.js';

const app = express();

app.use(cors({
  origin: [`chrome-extension://${process.env.EXTENSION_ID}`],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

app.use('/auth/*path', auth);
app.use('/health', health);
app.use('/jungles', jungle);

app.use(errorHandler);

export default app;