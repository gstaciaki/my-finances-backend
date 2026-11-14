import { prisma } from './extension';

type App = typeof prisma;
type TxExt = Parameters<Parameters<App['$transaction']>[0]>[0];

export type DbClient = App | TxExt;

export { prismaRaw } from './raw';
export { prisma } from './extension';
