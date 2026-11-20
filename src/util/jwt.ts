import { env } from '@src/config/env';
import jwt from 'jsonwebtoken';
import z from 'zod';

const secret = env.JWT_SECRET;

const AccessToken = z.object({
  sub: z.string(),
  sessionId: z.string(),
});

export default class JWT {
  public static signAccessToken({
    userId,
    sessionId,
  }: {
    userId: string;
    sessionId: string;
  }): string {
    return jwt.sign({ sub: userId, sessionId }, secret, { expiresIn: '15min' });
  }

  public static verifyAccessToken(token: string): (jwt.JwtPayload | string) | null {
    try {
      return AccessToken.parse(jwt.verify(token, secret));
    } catch {
      return null;
    }
  }
}
