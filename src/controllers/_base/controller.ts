import { Right, Wrong } from "@src/util/either";
import { sendError } from "@src/util/http";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export abstract class AbstractController<L extends Error, A> {
  getErrorMap = <K extends string>(v: {
    [key in K]: (req: Request, res: Response, result: L | Wrong<L, A>) => L;
  }) => v;

  protected ok(
    req: Request,
    res: Response,
    result: Right<L, A>
  ): A | undefined {
    return this.sendSuccess(res, StatusCodes.OK, result);
  }
  protected created(
    req: Request,
    res: Response,
    result: Right<L, A>
  ): A | undefined {
    return this.sendSuccess(res, StatusCodes.CREATED, result);
  }
  protected noContent(
    req: Request,
    res: Response,
    result: Right<L, A>
  ): A | undefined {
    return this.sendSuccess(res, StatusCodes.NO_CONTENT, result);
  }
  protected badRequest(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ): L {
    return this.sendError(req, res, StatusCodes.BAD_REQUEST, resultOrError);
  }
  protected unauthorized(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ): L {
    return this.sendError(req, res, StatusCodes.UNAUTHORIZED, resultOrError);
  }
  protected notFound(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ): L {
    return this.sendError(req, res, StatusCodes.NOT_FOUND, resultOrError);
  }
  protected conflict(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ): L {
    return this.sendError(req, res, StatusCodes.CONFLICT, resultOrError);
  }
  protected unprocessableEntity(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ): L {
    return this.sendError(
      req,
      res,
      StatusCodes.UNPROCESSABLE_ENTITY,
      resultOrError
    );
  }
  protected tooManyRequests(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ) {
    return this.sendError(
      req,
      res,
      StatusCodes.TOO_MANY_REQUESTS,
      resultOrError
    );
  }
  protected internalServerError(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ): L {
    return this.sendError(
      req,
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      resultOrError
    );
  }
  protected notImplemented(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ) {
    return this.sendError(req, res, StatusCodes.NOT_IMPLEMENTED, resultOrError);
  }
  protected serviceUnavailable(
    req: Request,
    res: Response,
    resultOrError: Wrong<L, A> | L
  ): L {
    return this.sendError(
      req,
      res,
      StatusCodes.SERVICE_UNAVAILABLE,
      resultOrError
    );
  }
  protected redirect(
    req: Request,
    res: Response,
    result: Right<L, A>,
    url: string
  ): A | undefined {
    const body = result?.value;
    res.redirect(StatusCodes.MOVED_TEMPORARILY, url);

    return body;
  }

  private sendSuccess(
    res: Response,
    status: StatusCodes,
    result: Right<L, A>
  ): A | undefined {
    const body = result?.value;
    res.status(status).send(body);

    return body;
  }

  private sendError(
    req: Request,
    res: Response,
    status: StatusCodes,
    resultOrError: Wrong<L, A> | L
  ): L {
    const error =
      resultOrError instanceof Wrong ? resultOrError?.value : resultOrError;
    sendError(req, res, error, status);

    return error;
  }
}
