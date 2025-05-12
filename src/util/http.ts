import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const sendError = (
  req: Request | Partial<Request>,
  res: Response | Partial<Response>,
  error: Error | unknown,
  code: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR,
) => {
  const errorResponse = {
    code: code,
    error: error instanceof Error ? error.message : (error ?? 'Erro interno no servidor'),
    slug: error instanceof Error ? error.name : 'Unknown',
  };

  res.status?.(code).send(errorResponse);
};
