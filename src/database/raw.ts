import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@src/generated/prisma/client';
import { env } from '@src/config/env';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const prismaRaw = new PrismaClient({ adapter });
