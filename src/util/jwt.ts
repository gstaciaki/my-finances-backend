import { env } from '@src/config/env';
import jwt from 'jsonwebtoken';

const secret = env.JWT_SECRET;

export default class JWT {
  public static signToken({
    userId,
    refresh = false,
    admin = false,
  }: {
    userId: string;
    refresh?: boolean;
    admin?: boolean;
  }): string {
    return jwt.sign({ user: { id: userId, admin } }, secret, {
      expiresIn: refresh ? '7d' : '15min',
    });
  }

  public static verifyToken(token: string): (jwt.JwtPayload | string) | null {
    try {
      return jwt.verify(token, secret);
    } catch {
      return null;
    }
  }
}
