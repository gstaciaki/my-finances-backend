import { app } from '@src/app';
import { prismaRaw } from '@src/database';
import { SYSTEM } from '@src/database/context';
import { requestLogMiddleware } from '@src/middlewares/request-log.middleware';
import express, { Router } from 'express';
import request from 'supertest';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { bearer, SEED_PASSWORD, waitForRequestLogs } from 'test/helpers/e2e';
import { genActor } from 'test/prefab/actor';
import { genUser } from 'test/prefab/user';

setupDatabaseLifecycle();

describe('RequestLog (e2e)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records method, route pattern, status, duration and actor', async () => {
    const actor = genActor();
    const id = genUser().id;

    const response = await request(app).get(`/api/user/${id}`).set(bearer(actor.userId));
    expect(response.status).toBe(404);

    const [row, ...rest] = await waitForRequestLogs();
    expect(rest).toHaveLength(0);
    expect(row).toMatchObject({
      method: 'GET',
      route: '/api/user/:id',
      status: 404,
      actorId: actor.userId,
    });
    expect(row.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('stores the route pattern, never the real id', async () => {
    const id = genUser().id;

    await request(app).get(`/api/user/${id}`).set(bearer(genActor().userId));

    const [row] = await waitForRequestLogs();
    expect(row.route).not.toContain(id);
  });

  it('records UNMATCHED for a route that does not exist', async () => {
    const response = await request(app).get('/api/nao-existe');
    expect(response.status).toBe(404);

    const [row] = await waitForRequestLogs();
    expect(row).toMatchObject({ method: 'GET', route: 'UNMATCHED', status: 404 });
  });

  it('records an unauthenticated request with no actor', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);

    const [row] = await waitForRequestLogs();
    expect(row.status).toBe(401);
    expect(row.actorId).toEqual(SYSTEM.userId);
  });

  it('records a public route (login) with no actor', async () => {
    await request(app).post('/api/login').send({ email: 'x@example.com', password: SEED_PASSWORD });

    const [row] = await waitForRequestLogs();
    expect(row).toMatchObject({ method: 'POST', route: '/api/login' });
    expect(row.actorId).toEqual(SYSTEM.userId);
  });

  it('does not store body, query string or headers', async () => {
    const actor = genActor();
    const body = {
      name: 'Nome Secreto',
      email: 'segredo@example.com',
      password: 'Senha-Muito-Secreta1!',
    };

    await request(app)
      .post('/api/user?token=valor-na-query')
      .set(bearer(actor.userId))
      .set('X-Custom-Secret', 'valor-no-header')
      .send(body);

    const [row] = await waitForRequestLogs();
    const stored = JSON.stringify(row);
    for (const secret of [
      body.name,
      body.email,
      body.password,
      'valor-na-query',
      'valor-no-header',
      'token=',
    ]) {
      expect(stored).not.toContain(secret);
    }
    expect(Object.keys(row).sort()).toEqual(
      ['actorId', 'at', 'durationMs', 'id', 'method', 'route', 'status'].sort(),
    );
  });

  it('writes one row per request', async () => {
    await request(app).get('/api/nao-existe');
    await request(app).get('/api/tambem-nao-existe');
    await request(app).get('/api/user');

    const rows = await waitForRequestLogs(3);
    expect(rows).toHaveLength(3);
  });

  it('does not log /health (registered before the middleware)', async () => {
    await request(app).get('/health');
    await request(app).get('/api/nao-existe');

    const rows = await waitForRequestLogs();
    expect(rows.map(r => r.route)).toEqual(['UNMATCHED']);
  });

  it('does not write to AuditLog (the log tables are not audited)', async () => {
    await request(app).get('/api/nao-existe');
    await waitForRequestLogs();

    expect(await prismaRaw.auditLog.count()).toBe(0);
  });

  describe('when writing the log fails', () => {
    it('does not change the response (rejected promise)', async () => {
      jest.spyOn(prismaRaw.requestLog, 'create').mockRejectedValue(new Error('db down'));

      const response = await request(app).get('/api/nao-existe');

      expect(response.status).toBe(404);
    });

    it('does not change the response (synchronous throw)', async () => {
      jest.spyOn(prismaRaw.requestLog, 'create').mockImplementation(() => {
        throw new Error('boom');
      });

      const response = await request(app).get('/api/nao-existe');

      expect(response.status).toBe(404);
    });
  });

  describe('route pattern with nested routers', () => {
    const nested = () => {
      const nestedApp = express();
      nestedApp.use(requestLogMiddleware);

      const transactions = Router({ mergeParams: true });
      transactions.get('/:id', (_req, res) => {
        res.json({});
      });

      const accounts = Router();
      accounts.use('/:accountId/transaction', transactions);
      nestedApp.use('/api/account', accounts);
      return nestedApp;
    };

    it('turns every param back into :name', async () => {
      const [accountId, id] = [genUser().id, genUser().id];

      const response = await request(nested()).get(`/api/account/${accountId}/transaction/${id}`);
      expect(response.status).toBe(200);

      const [row] = await waitForRequestLogs();
      expect(row.route).toBe('/api/account/:accountId/transaction/:id');
    });
  });
});
