import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@src/generated/prisma/client';
import { prismaRaw } from '@src/database/raw';

config({ quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_TEST });
export const prismaTest = new PrismaClient({ adapter });

afterAll(async () => {
  await prismaTest.$disconnect();
  await prismaRaw.$disconnect();
});
