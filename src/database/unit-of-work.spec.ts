import { prismaRaw } from '@src/database';
import { getActor } from '@src/database/context';
import { AlreadyExistsError } from '@src/errors/generic.errors';
import { Either, right, wrong } from '@src/util/either';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { genActor } from 'test/prefab/actor';
import { genUser } from 'test/prefab/user';
import { UnitOfWork } from './unit-of-work';

setupDatabaseLifecycle();

const auditRows = () => prismaRaw.auditLog.findMany({ orderBy: { at: 'asc' } });
const userCount = () => prismaRaw.user.count();

describe('UnitOfWork', () => {
  const uow = new UnitOfWork();

  describe('success (Right)', () => {
    it('commits the write and its audit row, and returns the Right untouched', async () => {
      const actor = genActor();
      const data = genUser();

      const result = await uow.run(actor, async ({ user }) => {
        const created = await user.create(data);
        return right<Error, string>(created.id);
      });

      expect(result.isRight()).toBe(true);
      expect(result.value).toBe(data.id);
      expect(await userCount()).toBe(1);

      const [row, ...rest] = await auditRows();
      expect(rest).toHaveLength(0);
      expect(row).toMatchObject({
        actorId: actor.userId,
        model: 'User',
        recordId: data.id,
        operation: 'create',
      });
    });

    it('audits every write of the callback, all with the callback actor', async () => {
      const actor = genActor();
      const data = genUser();

      await uow.run(actor, async ({ user }) => {
        await user.create(data);
        await user.update(data.id, { name: 'Outro Nome' });
        await user.delete(data.id);
        return right<Error, null>(null);
      });

      const rows = await auditRows();
      expect(rows.map(r => r.operation)).toEqual(['create', 'update', 'delete']);
      expect(rows.every(r => r.actorId === actor.userId)).toBe(true);
      expect(await userCount()).toBe(0);
    });

    it('lets the callback read its own uncommitted writes', async () => {
      const data = genUser();

      const result = await uow.run(genActor(), async ({ user }) => {
        await user.create(data);
        return right<Error, string | undefined>((await user.findById(data.id))?.id);
      });

      expect(result.value).toBe(data.id);
    });

    it('accepts the system actor', async () => {
      await uow.run({ userId: 'system' }, async ({ user }) => {
        await user.create(genUser());
        return right<Error, null>(null);
      });

      expect((await auditRows())[0].actorId).toBe('system');
    });
  });

  describe('Wrong', () => {
    it('rolls back everything (including AuditLog) and returns the same Wrong', async () => {
      const failure = wrong<Error, never>(new AlreadyExistsError('Usuário', 'email'));

      const result = await uow.run(genActor(), async ({ user }) => {
        await user.create(genUser());
        await user.create(genUser());
        return failure;
      });

      expect(result).toBe(failure);
      expect(result.isWrong()).toBe(true);
      expect(await userCount()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });

    it('does not throw for a Wrong (it is a value, not an exception)', async () => {
      await expect(
        uow.run(genActor(), async () => wrong<Error, never>(new Error('regra de negócio'))),
      ).resolves.toMatchObject({ value: new Error('regra de negócio') });
    });
  });

  describe('exception', () => {
    it('rolls back everything (including AuditLog) and rethrows the same error', async () => {
      const boom = new Error('boom');

      await expect(
        uow.run(genActor(), async ({ user }): Promise<Either<Error, null>> => {
          await user.create(genUser());
          throw boom;
        }),
      ).rejects.toBe(boom);

      expect(await userCount()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });

    it('rolls back when a later write fails (unique email) and surfaces the Prisma error', async () => {
      const first = genUser();
      const duplicate = genUser({ email: first.email });

      await expect(
        uow.run(genActor(), async ({ user }) => {
          await user.create(first);
          await user.create(duplicate);
          return right<Error, null>(null);
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      expect(await userCount()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });

    it('rejects with P2028 and persists nothing when the transaction times out', async () => {
      await expect(
        uow.run(
          genActor(),
          async ({ user }) => {
            await user.create(genUser());
            await new Promise(resolve => setTimeout(resolve, 300));
            await user.create(genUser());
            return right<Error, null>(null);
          },
          { timeout: 100 },
        ),
      ).rejects.toMatchObject({ code: 'P2028' });

      expect(await userCount()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });
  });

  describe('context', () => {
    it('exposes the actor inside the callback and clears it afterwards', async () => {
      const actor = genActor();
      let seen: unknown;

      await uow.run(actor, async () => {
        seen = getActor();
        return right<Error, null>(null);
      });

      expect(seen).toBe(actor);
      expect(getActor()).toBeUndefined();
    });

    it('clears the context even when the callback fails', async () => {
      await uow.run(genActor(), async () => wrong<Error, never>(new Error('x')));
      await uow.run(genActor(), async () => right<Error, null>(null));
      await expect(
        uow.run(genActor(), async () => {
          throw new Error('x');
        }),
      ).rejects.toThrow();

      expect(getActor()).toBeUndefined();
    });

    it('keeps concurrent runs isolated: each audit row carries its own actor', async () => {
      const [a, b] = [genActor(), genActor()];
      const [userA, userB] = [genUser(), genUser()];

      await Promise.all([
        uow.run(a, async ({ user }) => {
          await new Promise(resolve => setTimeout(resolve, 30));
          await user.create(userA);
          return right<Error, null>(null);
        }),
        uow.run(b, async ({ user }) => {
          await user.create(userB);
          return right<Error, null>(null);
        }),
      ]);

      const rows = await auditRows();
      expect(rows.find(r => r.recordId === userA.id)?.actorId).toBe(a.userId);
      expect(rows.find(r => r.recordId === userB.id)?.actorId).toBe(b.userId);
    });

    it('a failure in one run does not affect a concurrent successful run', async () => {
      const ok = genUser();

      const [good, bad] = await Promise.all([
        uow.run(genActor(), async ({ user }) => {
          await user.create(ok);
          return right<Error, null>(null);
        }),
        uow.run(genActor(), async ({ user }) => {
          await user.create(genUser());
          return wrong<Error, null>(new Error('falhou'));
        }),
      ]);

      expect(good.isRight()).toBe(true);
      expect(bad.isWrong()).toBe(true);
      const ids = (await prismaRaw.user.findMany()).map(u => u.id);
      expect(ids).toEqual([ok.id]);
      expect(await auditRows()).toHaveLength(1);
    });
  });
});
