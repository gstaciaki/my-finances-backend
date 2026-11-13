import { Prisma } from '@src/generated/prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

export type Actor = {
  userId: string;
};

export type RequestContext = {
  actor?: Actor;
  tx?: Prisma.TransactionClient;
};

export const SYSTEM: Actor = {
  userId: 'system',
};

export const contextStorage = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext {
  return contextStorage.getStore() ?? {};
}

export function getActor(): Actor | undefined {
  return getContext().actor;
}

export function getTx<T = Prisma.TransactionClient>(): T | undefined {
  return getContext().tx as T;
}
