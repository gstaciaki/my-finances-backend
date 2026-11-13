import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET é obrigatório'),
  DATABASE_URL: z.url('DATABASE_URL inválido').optional(),
  DATABASE_URL_TEST: z.url('DATABASE_URL_TEST inválido').optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Erro na validação das variáveis de ambiente:');
  console.error(parsed.error);
  process.exit(1);
}

// Com NODE_ENV=test a API usa sempre DATABASE_URL_TEST (AD-18);
// nos demais ambientes, DATABASE_URL.
const databaseUrl =
  parsed.data.NODE_ENV === 'test' ? parsed.data.DATABASE_URL_TEST : parsed.data.DATABASE_URL;

if (!databaseUrl) {
  const name = parsed.data.NODE_ENV === 'test' ? 'DATABASE_URL_TEST' : 'DATABASE_URL';
  console.error(`${name} é obrigatório quando NODE_ENV=${parsed.data.NODE_ENV}`);
  process.exit(1);
}

export const env = { ...parsed.data, DATABASE_URL: databaseUrl };
