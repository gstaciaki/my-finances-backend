import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { generateRefreshToken, hashRefreshToken } from './refresh-token';

describe('refresh token', () => {
  describe('generateRefreshToken', () => {
    it('returns a token and its hash', () => {
      const { token, hash } = generateRefreshToken();

      expect(typeof token).toBe('string');
      expect(typeof hash).toBe('string');
    });

    it('generates 32 random bytes as base64url (43 chars, URL and cookie safe)', () => {
      const { token } = generateRefreshToken();

      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it('generates a different token and hash on every call', () => {
      const tokens = new Set(Array.from({ length: 50 }, () => generateRefreshToken().token));
      const hashes = new Set(Array.from({ length: 50 }, () => generateRefreshToken().hash));

      expect(tokens.size).toBe(50);
      expect(hashes.size).toBe(50);
    });

    it('is opaque: not a JWT and carries no readable data', () => {
      const { token } = generateRefreshToken();

      expect(token.split('.')).toHaveLength(1);
      expect(jwt.decode(token)).toBeNull();
    });

    it('returns the hash of the token it generated', () => {
      const { token, hash } = generateRefreshToken();

      expect(hashRefreshToken(token)).toBe(hash);
    });

    it('never returns the token as its own hash', () => {
      const { token, hash } = generateRefreshToken();

      expect(hash).not.toBe(token);
      expect(hash).not.toContain(token);
    });
  });

  describe('hashRefreshToken', () => {
    it('is SHA-256 in hexadecimal (64 chars)', () => {
      const hash = hashRefreshToken('some-token');

      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).toBe(createHash('sha256').update('some-token').digest('hex'));
    });

    it('is deterministic, so the stored hash can be looked up later', () => {
      expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'));
    });

    it('gives different hashes for different tokens', () => {
      expect(hashRefreshToken('abc')).not.toBe(hashRefreshToken('abd'));
    });
  });
});
