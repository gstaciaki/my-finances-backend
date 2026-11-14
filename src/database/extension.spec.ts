import { prisma, prismaRaw } from '@src/database';
import { als } from '@src/database/context';
import { ForbiddenOperationError } from '@src/errors/forbidden-operation.error';
import { Prisma } from '@src/generated/prisma/client';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { runAsActor } from 'test/helpers/run-as-actor';
import { genActor } from 'test/prefab/actor';
import { genUser } from 'test/prefab/user';

setupDatabaseLifecycle();

const userData = (overrides: { name?: string; email?: string; password?: string } = {}) => {
  const { name, email, password } = genUser(overrides);
  return { name, email, password };
};

const auditRows = () => prismaRaw.auditLog.findMany({ orderBy: { at: 'asc' } });

describe('prisma extension', () => {
  describe('writes without actor', () => {
    it('refuses a write outside of any context and persists nothing', async () => {
      await expect(prisma.user.create({ data: userData() })).rejects.toThrow(
        new ForbiddenOperationError('writing without actor'),
      );

      expect(await prismaRaw.user.count()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });

    it('refuses a write with an actor but without a transaction', async () => {
      const actor = genActor();

      await expect(
        als.run({ actor }, async () => await prisma.user.create({ data: userData() })),
      ).rejects.toThrow(new ForbiddenOperationError('writing without transaction'));

      expect(await prismaRaw.user.count()).toBe(0);
    });

    it.each(['create', 'update', 'upsert', 'delete'] as const)(
      'requires an actor on %s',
      async operation => {
        const { id } = await prismaRaw.user.create({ data: userData() });
        const where = { id };
        const data = userData();

        const attempt = {
          create: () => prisma.user.create({ data }),
          update: () => prisma.user.update({ where, data: { name: 'x' } }),
          upsert: () => prisma.user.upsert({ where, create: data, update: { name: 'x' } }),
          delete: () => prisma.user.delete({ where }),
        }[operation];

        await expect(attempt()).rejects.toBeInstanceOf(ForbiddenOperationError);
        expect(await auditRows()).toHaveLength(0);
      },
    );
  });

  describe('blocked operations', () => {
    const many: Record<string, (tx: typeof prisma) => PromiseLike<unknown>> = {
      createMany: (tx: typeof prisma) => tx.user.createMany({ data: [userData()] }),
      createManyAndReturn: (tx: typeof prisma) =>
        tx.user.createManyAndReturn({ data: [userData()] }),
      updateMany: (tx: typeof prisma) => tx.user.updateMany({ data: { name: 'x' } }),
      updateManyAndReturn: (tx: typeof prisma) =>
        tx.user.updateManyAndReturn({ data: { name: 'x' } }),
      deleteMany: (tx: typeof prisma) => tx.user.deleteMany(),
    };

    it.each(Object.keys(many))('blocks %s even with actor and transaction', async operation => {
      await expect(
        runAsActor(genActor(), tx => many[operation](tx as typeof prisma)),
      ).rejects.toThrow(new ForbiddenOperationError(operation));

      expect(await prismaRaw.user.count()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });

    it('blocks $executeRaw', async () => {
      await expect(prisma.$executeRaw`DELETE FROM "User"`).rejects.toThrow(
        new ForbiddenOperationError('$executeRaw'),
      );
    });

    it('blocks $executeRawUnsafe', async () => {
      await expect(prisma.$executeRawUnsafe('DELETE FROM "User"')).rejects.toThrow(
        new ForbiddenOperationError('$executeRawUnsafe'),
      );
    });

    it.each(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'DROP', 'ALTER', 'CREATE'])(
      'blocks a $queryRawUnsafe containing %s',
      async keyword => {
        await expect(prisma.$queryRawUnsafe(`${keyword.toLowerCase()} "User"`)).rejects.toThrow(
          ForbiddenOperationError,
        );
      },
    );

    it('blocks a $queryRaw that writes', async () => {
      await prismaRaw.user.create({ data: userData() });

      await expect(prisma.$queryRaw`UPDATE "User" SET name = 'x' RETURNING id`).rejects.toThrow(
        ForbiddenOperationError,
      );
      expect(await prismaRaw.user.count({ where: { name: 'x' } })).toBe(0);
    });

    it('allows read-only raw queries', async () => {
      await expect(prisma.$queryRaw`SELECT 1 AS one`).resolves.toEqual([{ one: 1 }]);
      await expect(prisma.$queryRawUnsafe('SELECT 1 AS one')).resolves.toEqual([{ one: 1 }]);
    });

    it('does not mistake createdAt/updatedAt columns for write keywords', async () => {
      await expect(
        prisma.$queryRawUnsafe('SELECT "createdAt", "updatedAt" FROM "User"'),
      ).resolves.toEqual([]);
    });

    // O schema atual não tem relações. Habilitar quando Account/UserAccount existirem.
    it.todo('blocks nested relation writes (create, connectOrCreate, upsert, delete, ...)');
  });

  describe('audit', () => {
    it('audits a create with null before and masked password in after', async () => {
      const actor = genActor();
      const data = userData({ password: 'segredo-123' });

      const created = await runAsActor(actor, tx => tx.user.create({ data }));

      const [row, ...rest] = await auditRows();
      expect(rest).toHaveLength(0);
      expect(row).toMatchObject({
        actorId: actor.userId,
        model: 'User',
        recordId: created.id,
        operation: 'create',
        before: null,
      });
      expect(row.after).toMatchObject({ id: created.id, email: data.email, password: '***' });
    });

    it('stores the real password in the User table, only the audit is masked', async () => {
      const data = userData({ password: 'segredo-123' });
      const created = await runAsActor(genActor(), tx => tx.user.create({ data }));

      const stored = await prismaRaw.user.findUniqueOrThrow({ where: { id: created.id } });
      expect(stored.password).toBe('segredo-123');
    });

    it('audits an update with the previous and the new state', async () => {
      const actor = genActor();
      const { id, name } = await prismaRaw.user.create({ data: userData() });

      await runAsActor(actor, tx => tx.user.update({ where: { id }, data: { name: 'Novo Nome' } }));

      const [row] = await auditRows();
      expect(row).toMatchObject({
        actorId: actor.userId,
        model: 'User',
        recordId: id,
        operation: 'update',
      });
      expect(row.before).toMatchObject({ id, name, password: '***' });
      expect(row.after).toMatchObject({ id, name: 'Novo Nome', password: '***' });
    });

    it('audits a delete with the previous state and null after', async () => {
      const actor = genActor();
      const { id } = await prismaRaw.user.create({ data: userData() });

      await runAsActor(actor, tx => tx.user.delete({ where: { id } }));

      const [row] = await auditRows();
      expect(row).toMatchObject({ actorId: actor.userId, recordId: id, operation: 'delete' });
      expect(row.before).toMatchObject({ id, password: '***' });
      expect(row.after).toBeNull();
      expect(await prismaRaw.user.count()).toBe(0);
    });

    it('audits an upsert that creates', async () => {
      const data = userData();
      const id = genUser().id;

      await runAsActor(genActor(), tx =>
        tx.user.upsert({ where: { id }, create: { id, ...data }, update: { name: 'x' } }),
      );

      const [row] = await auditRows();
      expect(row).toMatchObject({ operation: 'upsert', recordId: id, before: null });
      expect(row.after).toMatchObject({ id, email: data.email });
    });

    it('audits an upsert that updates', async () => {
      const { id, name } = await prismaRaw.user.create({ data: userData() });

      await runAsActor(genActor(), tx =>
        tx.user.upsert({ where: { id }, create: userData(), update: { name: 'Atualizado' } }),
      );

      const [row] = await auditRows();
      expect(row).toMatchObject({ operation: 'upsert', recordId: id });
      expect(row.before).toMatchObject({ id, name });
      expect(row.after).toMatchObject({ id, name: 'Atualizado' });
    });

    it('records one audit row per write, in order, all with the same actor', async () => {
      const actor = genActor();

      await runAsActor(actor, async tx => {
        const user = await tx.user.create({ data: userData() });
        await tx.user.update({ where: { id: user.id }, data: { name: 'B' } });
        await tx.user.delete({ where: { id: user.id } });
      });

      const rows = await auditRows();
      expect(rows.map(r => r.operation)).toEqual(['create', 'update', 'delete']);
      expect(new Set(rows.map(r => r.actorId))).toEqual(new Set([actor.userId]));
    });

    it('does not audit reads and does not require an actor to read', async () => {
      const { id } = await prismaRaw.user.create({ data: userData() });

      await expect(prisma.user.findUnique({ where: { id } })).resolves.not.toBeNull();
      await expect(prisma.user.findMany()).resolves.toHaveLength(1);
      await expect(prisma.user.count()).resolves.toBe(1);

      expect(await auditRows()).toHaveLength(0);
    });

    it('rolls back the write and its audit row together when the transaction fails', async () => {
      await expect(
        runAsActor(genActor(), async tx => {
          await tx.user.create({ data: userData() });
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      expect(await prismaRaw.user.count()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });

    it('leaves no orphan audit row when the write itself fails (unique email)', async () => {
      const data = userData();
      await prismaRaw.user.create({ data });

      await expect(
        runAsActor(genActor(), tx => tx.user.create({ data: userData({ email: data.email }) })),
      ).rejects.toMatchObject({ code: 'P2002' });

      expect(await auditRows()).toHaveLength(0);
    });
  });

  describe('log tables', () => {
    it('writes RequestLog without actor and without generating an audit row', async () => {
      await prisma.requestLog.create({
        data: { method: 'GET', route: '/api/user/:id', status: 200, durationMs: 3, actorId: '' },
      });

      expect(await prismaRaw.requestLog.count()).toBe(1);
      expect(await auditRows()).toHaveLength(0);
    });

    it('does not audit the AuditLog writes themselves', async () => {
      await runAsActor(genActor(), tx => tx.user.create({ data: userData() }));

      // Um create => exatamente uma linha de auditoria (e não uma para o próprio AuditLog)
      expect(await prismaRaw.auditLog.count()).toBe(1);
      expect(await prismaRaw.auditLog.count({ where: { model: 'AuditLog' } })).toBe(0);
    });
  });

  it('keeps AuditLog.before as JSON null (not SQL NULL) on create', async () => {
    await runAsActor(genActor(), tx => tx.user.create({ data: userData() }));

    const [{ is_json_null }] = await prismaRaw.$queryRaw<Array<{ is_json_null: boolean }>>(
      Prisma.sql`SELECT ("before" = 'null'::jsonb) AS is_json_null FROM "AuditLog"`,
    );
    expect(is_json_null).toBe(true);
  });
});
