import JWT from '@src/util/jwt';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export type TokenPayload = {
  user: {
    id: string;
    admin: boolean;
  };
};
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = JWT.verifyToken(token) as TokenPayload;

    (req as JwtPayload).user = decoded.user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
