import { DbClient, prisma } from '@src/database';
import { Actor, als } from '@src/database/context';
import { Prisma } from '@src/generated/prisma/client';

/**
 * Abre uma transação do cliente estendido e guarda `{ actor, tx }` no contexto,
 * do mesmo jeito que o Unit of Work faz. Serve para os testes exercitarem o cliente
 * estendido de verdade (bloqueios e auditoria) sem depender do Unit of Work.
 */
export function runAsActor<T>(actor: Actor, fn: (tx: DbClient) => PromiseLike<T>): Promise<T> {
  return prisma.$transaction(tx =>
    // O `await` precisa ficar DENTRO do als.run: o PrismaPromise é preguiçoso e só executa
    // quando alguém dá then/await. Retornar `fn(tx)` direto faria a query rodar fora do contexto.
    als.run({ actor, tx: tx as unknown as Prisma.TransactionClient }, async () => await fn(tx)),
  );
}
