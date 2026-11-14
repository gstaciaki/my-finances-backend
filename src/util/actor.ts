import { Actor } from '@src/database/context';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

/** Monta o Actor a partir do `req.user` que o authMiddleware preenche. */
export function actorFromRequest(req: Request): Actor {
  return { userId: (req as JwtPayload).user.id };
}
