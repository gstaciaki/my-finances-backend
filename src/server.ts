import { env } from '@src/config/env';
import { app } from './app';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
