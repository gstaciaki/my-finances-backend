import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InputValidationError } from '@src/errors/input-validation.error';

export const sendError = (
  req: Request | Partial<Request>,
  res: Response | Partial<Response>,
  error: Error | unknown,
  code: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR,
) => {
  let errorResponse;

  if (error instanceof InputValidationError) {
    errorResponse = {
      code,
      error: {
        message: error.message,
        errors: error.formatted,
      },
      slug: error.name,
    };
  } else {
    errorResponse = {
      code,
      error: error instanceof Error ? error.message : (error ?? 'Erro interno no servidor'),
      slug: error instanceof Error ? error.name : 'Unknown',
    };
  }

  res.status?.(code).send(errorResponse);
};
