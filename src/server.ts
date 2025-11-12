import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes';
import { env } from '@src/config/env';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('API funcionando!');
});

app.use('/api', routes);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
