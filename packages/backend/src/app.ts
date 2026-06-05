import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: [`chrome-extension://${process.env.EXTENSION_ID}`, 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.send('server is running');
});

export default app;