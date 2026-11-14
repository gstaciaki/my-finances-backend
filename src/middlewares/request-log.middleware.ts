import { prismaRaw } from '@src/database';
import { SYSTEM } from '@src/database/context';
import { NextFunction, Request, Response } from 'express';

export function requestLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    try {
      let base = req.baseUrl;
      for (const [key, value] of Object.entries(req.params ?? {})) {
        if (typeof value === 'string' && value) base = base.split(`/${value}`).join(`/:${key}`);
      }
      const route = req.route ? `${base}${req.route.path}` : 'UNMATCHED';

      prismaRaw.requestLog
        .create({
          data: {
            method: req.method,
            route,
            status: res.statusCode,
            durationMs: Date.now() - start,
            actorId: (req as Request & { user?: { id: string } }).user?.id ?? SYSTEM.userId,
          },
        })
        .catch(() => {});
    } catch {
      // falha de log nunca altera a resposta
    }
  });
  next();
}
