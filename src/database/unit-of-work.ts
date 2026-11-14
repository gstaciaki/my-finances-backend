import { IUserRepository, UserRepository } from '@src/repositories/user/user.repository';
import { DbClient, prisma } from '.';
import { Actor, als } from './context';
import { Either } from '@src/util/either';
import { Prisma } from '@src/generated/prisma/client';
import { Rollback } from '@src/errors/rollback.errors';

export type Repositories = { user: IUserRepository };
export const createRepositories = (db: DbClient): Repositories => ({
  user: new UserRepository(db),
});
export type UnitOfWorkOptions = { timeout?: number; maxWait?: number };

export interface IUnitOfWork {
  run<L, R>(
    actor: Actor,
    fn: (repos: Repositories) => Promise<Either<L, R>>,
    opts?: UnitOfWorkOptions,
  ): Promise<Either<L, R>>;
}

export class UnitOfWork implements IUnitOfWork {
  async run<L, R>(
    actor: Actor,
    fn: (repos: Repositories) => Promise<Either<L, R>>,
    opts: UnitOfWorkOptions = {},
  ): Promise<Either<L, R>> {
    try {
      return await prisma.$transaction(
        tx =>
          als.run({ actor, tx: tx as unknown as Prisma.TransactionClient }, async () => {
            const result = await fn(createRepositories(tx));
            if (result.isWrong()) throw new Rollback(result);
            return result;
          }),
        { timeout: 30_000, maxWait: 5_000, ...opts },
      );
    } catch (e) {
      if (e instanceof Rollback) return e.wrong as Either<L, R>;
      throw e;
    }
  }
}
