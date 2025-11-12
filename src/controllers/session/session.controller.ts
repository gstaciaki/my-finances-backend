import { Request, Response } from 'express';
import { AbstractController } from '@src/core/controller';
import { DefaultFailOutput } from '@src/types/errors';
import { SessionControllerOutput } from '@src/use-cases/session/dtos';
import { LoginUseCase } from '@src/use-cases/session/login/login.usecase';
import { RefreshTokenUseCase } from '@src/use-cases/session/refresh-token/refresh-token.usecase';

type FailOutput = DefaultFailOutput;
type SuccessOutput = SessionControllerOutput;

export class SessionController extends AbstractController<FailOutput, SuccessOutput> {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {
    super();
  }

  async login(req: Request, res: Response) {
    const result = await this.loginUseCase.run(req.body);
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async refresh(req: Request, res: Response) {
    const result = await this.refreshTokenUseCase.run(req.body);
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }
}
