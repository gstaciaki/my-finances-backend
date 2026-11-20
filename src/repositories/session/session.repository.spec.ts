import { DbClient, prisma, prismaRaw } from '@src/database';
import { createRepositories } from '@src/database/unit-of-work';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { runAsActor } from 'test/helpers/run-as-actor';
import { genActor } from 'test/prefab/actor';
import { genSession } from 'test/prefab/session';
import { genUser } from 'test/prefab/user';
import { UserRepository } from '../user/user.repository';
import { SessionRepository } from './session.repository';

setupDatabaseLifecycle();

// Usa o cliente estendido de verdade, como o user.repository.spec: toda escrita roda
// em transação, com actor, e deixa AuditLog.
const withRepositories = <T>(
  fn: (repos: { session: SessionRepository; user: UserRepository }, tx: DbClient) => Promise<T>,
) =>
  runAsActor(genActor(), tx =>
    fn({ session: new SessionRepository(tx), user: new UserRepository(tx) }, tx),
  );

describe('SessionRepository', () => {
  it('is available in createRepositories', async () => {
    await runAsActor(genActor(), async tx => {
      expect(createRepositories(tx).session).toBeInstanceOf(SessionRepository);
    });
  });

  describe('create', () => {
    it('persists the session with the defaults of a new login', async () => {
      const created = await withRepositories(async ({ session, user }) => {
        const owner = await user.create(genUser());
        return session.create(genSession({ userId: owner.id }));
      });

      expect(created.revokedAt).toBeNull();
      expect(created.previousRefreshTokenHash).toBeNull();
      expect(created.rotatedAt).toBeNull();
      expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(await prismaRaw.session.count()).toBe(1);
    });

    it('rejects a refreshTokenHash that already exists (unique)', async () => {
      const refreshTokenHash = 'a'.repeat(64);

      await expect(
        withRepositories(async ({ session, user }) => {
          const owner = await user.create(genUser());
          await session.create(genSession({ userId: owner.id, refreshTokenHash }));
          await session.create(genSession({ userId: owner.id, refreshTokenHash }));
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      expect(await prismaRaw.session.count()).toBe(0);
    });

    it('rejects a session for a user that does not exist (foreign key)', async () => {
      await expect(
        withRepositories(({ session }) =>
          session.create(genSession({ userId: '7d1f5f0e-6c3a-4a53-9a4c-0b6f4a5f8a99' })),
        ),
      ).rejects.toMatchObject({ code: 'P2003' });
    });

    it('allows several sessions for the same user (one per device)', async () => {
      await withRepositories(async ({ session, user }) => {
        const owner = await user.create(genUser());
        await session.create(genSession({ userId: owner.id }));
        await session.create(genSession({ userId: owner.id }));
      });

      expect(await prismaRaw.session.count()).toBe(2);
    });
  });

  describe('findByIdWithUser', () => {
    it('returns the session together with its user', async () => {
      const owner = genUser();
      const found = await withRepositories(async ({ session, user }) => {
        await user.create(owner);
        const created = await session.create(genSession({ userId: owner.id }));
        return session.findByIdWithUser(created.id);
      });

      expect(found).not.toBeNull();
      expect(found?.userId).toBe(owner.id);
      expect(found?.user).toMatchObject({
        id: owner.id,
        email: owner.email,
        admin: false,
        deletedAt: null,
      });
    });

    it('returns the user flags the middleware needs to decide (isAdmin and deletedAt)', async () => {
      const owner = genUser();
      const deletedAt = new Date();
      const found = await withRepositories(async ({ session, user }) => {
        await user.create(owner);
        await user.update(owner.id, { admin: true, deletedAt });
        const created = await session.create(genSession({ userId: owner.id }));
        return session.findByIdWithUser(created.id);
      });

      expect(found?.user.admin).toBe(true);
      expect(found?.user.deletedAt).toEqual(deletedAt);
    });

    it('returns a revoked session as well, with revokedAt filled (the middleware rejects it)', async () => {
      const revokedAt = new Date();
      const found = await withRepositories(async ({ session, user }) => {
        const owner = await user.create(genUser());
        const created = await session.create(genSession({ userId: owner.id, revokedAt }));
        return session.findByIdWithUser(created.id);
      });

      expect(found?.revokedAt).toEqual(revokedAt);
    });

    it('returns null when the session does not exist', async () => {
      const found = await withRepositories(({ session }) =>
        session.findByIdWithUser('7d1f5f0e-6c3a-4a53-9a4c-0b6f4a5f8a99'),
      );

      expect(found).toBeNull();
    });
  });

  describe('revoke', () => {
    it('fills revokedAt with the current time', async () => {
      const before = Date.now();
      const revoked = await withRepositories(async ({ session, user }) => {
        const owner = await user.create(genUser());
        const created = await session.create(genSession({ userId: owner.id }));
        return session.revoke(created.id);
      });

      expect(revoked.revokedAt).not.toBeNull();
      expect(revoked.revokedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
      expect(revoked.revokedAt!.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('revokes only the given session, not the others of the same user', async () => {
      const { first, second } = await withRepositories(async ({ session, user }) => {
        const owner = await user.create(genUser());
        const a = await session.create(genSession({ userId: owner.id }));
        const b = await session.create(genSession({ userId: owner.id }));
        await session.revoke(a.id);
        return { first: await session.findById(a.id), second: await session.findById(b.id) };
      });

      expect(first?.revokedAt).not.toBeNull();
      expect(second?.revokedAt).toBeNull();
    });

    it('fails for a session that does not exist', async () => {
      await expect(
        withRepositories(({ session }) => session.revoke('7d1f5f0e-6c3a-4a53-9a4c-0b6f4a5f8a99')),
      ).rejects.toMatchObject({ code: 'P2025' });
    });
  });

  describe('audit', () => {
    it('audits the creation and masks both refresh token hashes', async () => {
      const data = genSession({
        userId: '',
        previousRefreshTokenHash: 'b'.repeat(64),
      });
      await withRepositories(async ({ session, user }) => {
        const owner = await user.create(genUser());
        await session.create({ ...data, userId: owner.id });
      });

      const rows = await prismaRaw.auditLog.findMany({ where: { model: 'Session' } });
      expect(rows).toHaveLength(1);
      expect(rows[0].operation).toBe('create');
      expect(rows[0].after).toMatchObject({
        refreshTokenHash: '***',
        previousRefreshTokenHash: '***',
      });
      expect(JSON.stringify(rows[0])).not.toContain(data.refreshTokenHash);
    });

    it('audits the revocation with before and after', async () => {
      await withRepositories(async ({ session, user }) => {
        const owner = await user.create(genUser());
        const created = await session.create(genSession({ userId: owner.id }));
        await session.revoke(created.id);
      });

      const rows = await prismaRaw.auditLog.findMany({
        where: { model: 'Session', operation: 'update' },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].before).toMatchObject({ revokedAt: null });
      expect((rows[0].after as { revokedAt: string }).revokedAt).not.toBeNull();
    });

    it('refuses to write a session without actor', async () => {
      await expect(
        prisma.session.create({ data: genSession({ userId: genUser().id }) }),
      ).rejects.toThrow();
    });
  });
});
