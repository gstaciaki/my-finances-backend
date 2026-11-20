import { app } from '@src/app';
import { prismaRaw } from '@src/database';
import { env } from '@src/config/env';
import { generateRefreshToken } from '@src/util/refresh-token';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { auditRows, authenticate, bearer, seedSession, seedUser } from 'test/helpers/e2e';

setupDatabaseLifecycle();

// Rota protegida usada como alvo: só lê, então não deixa AuditLog.
const PROTECTED = '/api/user';

const unauthorized = {
  code: 401,
  error: expect.anything(),
  slug: expect.any(String),
};

const withToken = (token: string) => ({ Authorization: `Bearer ${token}` });
const past = () => new Date(Date.now() - 60_000);

describe('authMiddleware (e2e)', () => {
  describe('accepts a valid session', () => {
    it('200 with a token of an active session', async () => {
      const { headers } = await authenticate();

      const response = await request(app).get(PROTECTED).set(headers);

      expect(response.status).toBe(200);
    });

    it('does not write to AuditLog when authenticating', async () => {
      const { headers } = await authenticate();

      await request(app).get(PROTECTED).set(headers).expect(200);

      expect(await auditRows()).toHaveLength(0);
    });
  });

  describe('rejects with 401 and the { code, error, slug } body', () => {
    it('without the Authorization header', async () => {
      const response = await request(app).get(PROTECTED);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(unauthorized);
    });

    it.each([
      ['no token after Bearer', 'Bearer'],
      ['another scheme', 'Basic abc123'],
      ['garbage token', 'Bearer isto-nao-e-um-jwt'],
      ['empty token', 'Bearer '],
    ])('with a bad header (%s)', async (_label, header) => {
      const response = await request(app).get(PROTECTED).set('Authorization', header);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(unauthorized);
    });

    it('with an expired token', async () => {
      const { user, session } = await authenticate();
      const token = jwt.sign({ sub: user.id, sessionId: session.id }, env.JWT_SECRET, {
        expiresIn: -10,
      });

      const response = await request(app).get(PROTECTED).set(withToken(token));

      expect(response.status).toBe(401);
      expect(response.body).toEqual(unauthorized);
    });

    it('with a token signed by another secret', async () => {
      const { user, session } = await authenticate();
      const token = jwt.sign({ sub: user.id, sessionId: session.id }, 'outro-segredo', {
        expiresIn: '15m',
      });

      await request(app).get(PROTECTED).set(withToken(token)).expect(401);
    });

    it('with the old token format ({ user: { id, admin } })', async () => {
      const { user } = await authenticate();
      const token = jwt.sign({ user: { id: user.id, admin: false } }, env.JWT_SECRET, {
        expiresIn: '15m',
      });

      await request(app).get(PROTECTED).set(withToken(token)).expect(401);
    });

    it('with a token that has no sessionId', async () => {
      const { user } = await authenticate();
      const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '15m' });

      await request(app).get(PROTECTED).set(withToken(token)).expect(401);
    });

    it('with the opaque refresh token in place of the access token (NFR-5)', async () => {
      const { user } = await authenticate();
      const { token, hash } = generateRefreshToken();
      await seedSession(user.id, { refreshTokenHash: hash });

      await request(app).get(PROTECTED).set(withToken(token)).expect(401);
    });

    it('with a valid JWT whose session does not exist', async () => {
      const user = await seedUser();

      const response = await request(app)
        .get(PROTECTED)
        .set(bearer(user.id, '0a3c1b8e-2d44-4d0e-8a1e-5d1c1f7d9b22'));

      expect(response.status).toBe(401);
      expect(response.body).toEqual(unauthorized);
    });

    it('with a revoked session', async () => {
      const user = await seedUser();
      const session = await seedSession(user.id, { revokedAt: past() });

      await request(app).get(PROTECTED).set(bearer(user.id, session.id)).expect(401);
    });

    it('with a session past its expiresAt (7 days without use)', async () => {
      const user = await seedUser();
      const session = await seedSession(user.id, { expiresAt: past() });

      await request(app).get(PROTECTED).set(bearer(user.id, session.id)).expect(401);
    });

    it('with a user that has deletedAt', async () => {
      const user = await seedUser({ deletedAt: past() });
      const session = await seedSession(user.id);

      await request(app).get(PROTECTED).set(bearer(user.id, session.id)).expect(401);
    });

    it('when sub is one user and sessionId belongs to another', async () => {
      const [a, b] = [await authenticate(), await authenticate()];

      const response = await request(app).get(PROTECTED).set(bearer(a.user.id, b.session.id));

      expect(response.status).toBe(401);
    });
  });

  describe('takes effect immediately, with no cache', () => {
    it('revoking the session makes the same token fail on the next request', async () => {
      const { session, headers } = await authenticate();
      await request(app).get(PROTECTED).set(headers).expect(200);

      await prismaRaw.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      await request(app).get(PROTECTED).set(headers).expect(401);
    });

    it('revoking one session does not affect another session of the same user', async () => {
      const { user, session, headers } = await authenticate();
      const other = await seedSession(user.id);

      await prismaRaw.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      await request(app).get(PROTECTED).set(headers).expect(401);
      await request(app).get(PROTECTED).set(bearer(user.id, other.id)).expect(200);
    });

    it('marking the user as deleted makes the same token fail on the next request', async () => {
      const { user, headers } = await authenticate();
      await request(app).get(PROTECTED).set(headers).expect(200);

      await prismaRaw.user.update({ where: { id: user.id }, data: { deletedAt: new Date() } });

      await request(app).get(PROTECTED).set(headers).expect(401);
    });
  });
});
