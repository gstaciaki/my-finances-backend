import { env } from '@src/config/env';
import jwt from 'jsonwebtoken';
import JWT from './jwt';
import { generateRefreshToken } from './refresh-token';

const userId = '6f1f5f0e-6c3a-4a53-9a4c-0b6f4a5f8a11';
const sessionId = '0a3c1b8e-2d44-4d0e-8a1e-5d1c1f7d9b22';

describe('JWT access token', () => {
  describe('signAccessToken', () => {
    it('carries only sub and sessionId (plus iat and exp)', () => {
      const token = JWT.signAccessToken({ userId, sessionId });
      const payload = jwt.decode(token) as Record<string, unknown>;
      expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sessionId', 'sub']);
      expect(payload.sub).toBe(userId);
      expect(payload.sessionId).toBe(sessionId);
    });
    it('does not carry admin or permission data (AD-5)', () => {
      const payload = jwt.decode(JWT.signAccessToken({ userId, sessionId })) as Record<
        string,
        unknown
      >;
      expect(payload).not.toHaveProperty('admin');
      expect(payload).not.toHaveProperty('isAdmin');
      expect(payload).not.toHaveProperty('user');
    });
    it('expires in exactly 15 minutes', () => {
      const payload = jwt.decode(JWT.signAccessToken({ userId, sessionId })) as {
        iat: number;
        exp: number;
      };
      expect(payload.exp - payload.iat).toBe(15 * 60);
    });
    it('is signed with HS256 and the JWT_SECRET', () => {
      const token = JWT.signAccessToken({ userId, sessionId });
      expect(jwt.decode(token, { complete: true })?.header.alg).toBe('HS256');
      expect(() => jwt.verify(token, env.JWT_SECRET)).not.toThrow();
    });
  });
  describe('verifyAccessToken', () => {
    it('returns userId and sessionId for a valid token', () => {
      const token = JWT.signAccessToken({ userId, sessionId });
      expect(JWT.verifyAccessToken(token)).toEqual({ sub: userId, sessionId });
    });
    it('returns null for an expired token', () => {
      const token = jwt.sign({ sessionId }, env.JWT_SECRET, { subject: userId, expiresIn: -10 });
      expect(JWT.verifyAccessToken(token)).toBeNull();
    });
    it('returns null for a token signed with another secret', () => {
      const token = jwt.sign({ sessionId }, 'another-secret', {
        subject: userId,
        expiresIn: '15m',
      });
      expect(JWT.verifyAccessToken(token)).toBeNull();
    });
    it('returns null for an unsigned token (alg none)', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(JSON.stringify({ sub: userId, sessionId })).toString('base64url');
      expect(JWT.verifyAccessToken(`${header}.${body}.`)).toBeNull();
    });
    it.each([
      ['empty string', ''],
      ['garbage', 'not-a-jwt'],
      ['two parts', 'aaa.bbb'],
    ])('returns null for a malformed token (%s)', (_label, token) => {
      expect(JWT.verifyAccessToken(token)).toBeNull();
    });
    it('returns null when sessionId is missing', () => {
      const token = jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: '15m' });
      expect(JWT.verifyAccessToken(token)).toBeNull();
    });
    it('returns null when sub is missing', () => {
      const token = jwt.sign({ sessionId }, env.JWT_SECRET, { expiresIn: '15m' });
      expect(JWT.verifyAccessToken(token)).toBeNull();
    });
    it('returns null for the old payload format ({ user: { id, admin } })', () => {
      const token = jwt.sign({ user: { id: userId, admin: false } }, env.JWT_SECRET, {
        expiresIn: '15m',
      });
      expect(JWT.verifyAccessToken(token)).toBeNull();
    });
    it('returns null for an opaque refresh token (NFR-5: finalidades distintas)', () => {
      const { token } = generateRefreshToken();
      expect(JWT.verifyAccessToken(token)).toBeNull();
    });
  });
});
