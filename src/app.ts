import express from 'express';
import cors from 'cors';
import { routes } from './routes';

const application = express();

application.use(cors());
application.use(express.json());

application.get('/health', (req, res) => {
  res.send('API funcionando!');
});

application.use('/api', routes);

export const app = application;
