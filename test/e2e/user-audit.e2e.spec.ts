import { app } from '@src/app';
import { prismaRaw } from '@src/database';
import request from 'supertest';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { auditRows, bearer, seedUser, SEED_PASSWORD } from 'test/helpers/e2e';
import { genActor } from 'test/prefab/actor';
import { genUser } from 'test/prefab/user';

setupDatabaseLifecycle();

const errorBody = (code: number) => ({
  code,
  error: expect.anything(),
  slug: expect.any(String),
});

describe('users API: audit, rollback and errors (e2e)', () => {
  const actor = genActor();
  const auth = bearer(actor.userId);

  describe('writes leave an AuditLog with the token actor', () => {
    it('POST /api/user', async () => {
      const body = { name: 'Maria', email: 'maria@example.com', password: 'Password123!' };

      const response = await request(app).post('/api/user').set(auth).send(body);
      expect(response.status).toBe(201);

      const [row, ...rest] = await auditRows();
      expect(rest).toHaveLength(0);
      expect(row).toMatchObject({
        actorId: actor.userId,
        model: 'User',
        operation: 'create',
        before: null,
      });
      expect(row.recordId).toBe(response.body.id);
      expect(row.after).toMatchObject({ email: body.email, password: '***' });
      expect(JSON.stringify(row)).not.toContain(body.password);
    });

    it('PATCH /api/user/:id', async () => {
      const user = await seedUser({ name: 'Antes' });

      const response = await request(app)
        .patch(`/api/user/${user.id}`)
        .set(auth)
        .send({ name: 'Depois' });
      expect(response.status).toBe(200);

      const [row, ...rest] = await auditRows();
      expect(rest).toHaveLength(0);
      expect(row).toMatchObject({
        actorId: actor.userId,
        model: 'User',
        recordId: user.id,
        operation: 'update',
      });
      expect(row.before).toMatchObject({ name: 'Antes', password: '***' });
      expect(row.after).toMatchObject({ name: 'Depois', password: '***' });
    });

    it('DELETE /api/user/:id', async () => {
      const user = await seedUser();

      const response = await request(app).delete(`/api/user/${user.id}`).set(auth);
      expect(response.status).toBe(200);

      const [row, ...rest] = await auditRows();
      expect(rest).toHaveLength(0);
      expect(row).toMatchObject({
        actorId: actor.userId,
        recordId: user.id,
        operation: 'delete',
        after: null,
      });
      expect(row.before).toMatchObject({ id: user.id, password: '***' });
      expect(await prismaRaw.user.count()).toBe(0);
    });

    it('POST /api/user/change-password', async () => {
      const user = await seedUser();
      const newPassword = 'NovaSenha123!';

      const response = await request(app)
        .post('/api/user/change-password')
        .set(auth)
        .send({ email: user.email, currentPassword: SEED_PASSWORD, newPassword });
      expect(response.status).toBe(200);

      const [row, ...rest] = await auditRows();
      expect(rest).toHaveLength(0);
      expect(row).toMatchObject({ actorId: actor.userId, recordId: user.id, operation: 'update' });
      expect(row.before).toMatchObject({ password: '***' });
      expect(row.after).toMatchObject({ password: '***' });
      expect(JSON.stringify(row)).not.toContain(newPassword);

      const stored = await prismaRaw.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(stored.password).not.toBe(user.password);
    });

    it('reads leave no AuditLog', async () => {
      const user = await seedUser();

      await request(app).get('/api/user').set(auth).expect(200);
      await request(app).get(`/api/user/${user.id}`).set(auth).expect(200);

      expect(await auditRows()).toHaveLength(0);
    });
  });

  describe('a failed rule leaves nothing behind', () => {
    it('duplicate e-mail on create: 409, no new user and no orphan AuditLog', async () => {
      const existing = await seedUser();

      const response = await request(app)
        .post('/api/user')
        .set(auth)
        .send({ name: 'Outro', email: existing.email, password: 'Password123!' });

      expect(response.status).toBe(409);
      expect(await prismaRaw.user.count()).toBe(1);
      expect(await auditRows()).toHaveLength(0);
    });

    it('two simultaneous creates with the same e-mail: one 201, one 409, one AuditLog', async () => {
      const body = { name: 'Corrida', email: 'corrida@example.com', password: 'Password123!' };

      const responses = await Promise.all([
        request(app).post('/api/user').set(auth).send(body),
        request(app).post('/api/user').set(auth).send(body),
      ]);

      expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
      expect(await prismaRaw.user.count()).toBe(1);
      expect(await auditRows()).toHaveLength(1);
    });

    it('duplicate e-mail on update: 409 and no AuditLog', async () => {
      const [a, b] = [await seedUser(), await seedUser()];

      const response = await request(app)
        .patch(`/api/user/${a.id}`)
        .set(auth)
        .send({ email: b.email });

      expect(response.status).toBe(409);
      expect(await auditRows()).toHaveLength(0);
      expect((await prismaRaw.user.findUniqueOrThrow({ where: { id: a.id } })).email).toBe(a.email);
    });

    it('wrong current password on change-password: 401 and nothing written', async () => {
      const user = await seedUser();

      const response = await request(app)
        .post('/api/user/change-password')
        .set(auth)
        .send({ email: user.email, currentPassword: 'Errada123!', newPassword: 'NovaSenha123!' });

      expect(response.status).toBe(401);
      expect(await auditRows()).toHaveLength(0);
      expect((await prismaRaw.user.findUniqueOrThrow({ where: { id: user.id } })).password).toBe(
        user.password,
      );
    });
  });

  describe('errors are never a 500, and the body is { code, error, slug }', () => {
    it('409 on a duplicate', async () => {
      const existing = await seedUser();

      const response = await request(app)
        .post('/api/user')
        .set(auth)
        .send({ name: 'X', email: existing.email, password: 'Password123!' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual(errorBody(409));
    });

    it.each([
      ['GET', (id: string) => request(app).get(`/api/user/${id}`)],
      ['PATCH', (id: string) => request(app).patch(`/api/user/${id}`).send({ name: 'X' })],
      ['DELETE', (id: string) => request(app).delete(`/api/user/${id}`)],
    ])('404 on %s of an unknown user', async (_, call) => {
      const response = await call(genUser().id).set(auth);

      expect(response.status).toBe(404);
      expect(response.body).toEqual(errorBody(404));
      expect(await auditRows()).toHaveLength(0);
    });

    it('400 on invalid input, with the field errors', async () => {
      const response = await request(app)
        .post('/api/user')
        .set(auth)
        .send({ name: '', email: 'invalido', password: 'fraca' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: 400, slug: 'InputValidationError' });
      expect(Object.keys(response.body.error.errors)).toEqual(
        expect.arrayContaining(['name', 'email', 'password']),
      );
      expect(await auditRows()).toHaveLength(0);
    });

    it('401 without a token, and nothing is written', async () => {
      const response = await request(app)
        .post('/api/user')
        .send({ name: 'X', email: 'x@example.com', password: 'Password123!' });

      expect(response.status).toBe(401);
      expect(await prismaRaw.user.count()).toBe(0);
      expect(await auditRows()).toHaveLength(0);
    });
  });
});
