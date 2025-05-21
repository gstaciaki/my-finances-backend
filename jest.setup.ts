import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();
export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST,
    },
  },
});
