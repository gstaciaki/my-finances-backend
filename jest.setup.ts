import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@src/generated/prisma/client';

config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_TEST });
export const prismaTest = new PrismaClient({ adapter });
