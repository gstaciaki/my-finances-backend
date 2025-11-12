import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET é obrigatório'),
  DATABASE_URL: z.url('DATABASE_URL inválido'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Erro na validação das variáveis de ambiente:');
  console.error(parsed.error);
  process.exit(1);
}

export const env = parsed.data;
