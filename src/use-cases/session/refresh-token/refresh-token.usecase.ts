import { AbstractUseCase } from '@src/core/use-case';
import { Either, right, wrong } from '@src/util/either';
import { DefaultFailOutput } from '@src/types/errors';
import {
  RefreshTokenUseCaseInput,
  RefreshTokenUseCaseOutput,
  RefreshTokenUseCaseSchema,
} from '../dtos';
import JWT from '@src/util/jwt';
import { ZodType } from 'zod';
import { InvalidRefreshTokenError } from '@src/errors/login.errors';
import { TokenPayload } from '@src/middlewares/auth.middleware';

type Input = RefreshTokenUseCaseInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = RefreshTokenUseCaseOutput;

export class RefreshTokenUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor() {
    super();
  }

  protected validationRules(): ZodType<Input> {
    return RefreshTokenUseCaseSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const { refreshToken } = input;
    const refreshTokenDecoded = JWT.verifyToken(refreshToken) as TokenPayload | null;

    if (!refreshTokenDecoded) {
      return wrong(new InvalidRefreshTokenError());
    }

    const { user } = refreshTokenDecoded;

    const accessToken = JWT.signToken({ userId: user.id });
    return right({ accessToken, refreshToken });
  }
}
