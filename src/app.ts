import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { requestLogMiddleware } from './middlewares/request-log.middleware';

const application = express();

application.use(cors());
application.use(express.json());

application.get('/health', (req, res) => {
  res.send('API funcionando!');
});

application.use(requestLogMiddleware);

application.use('/api', routes);

export const app = application;
