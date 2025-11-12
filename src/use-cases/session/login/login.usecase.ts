import { AbstractUseCase } from '@src/core/use-case';
import { Either, right, wrong } from '@src/util/either';
import { DefaultFailOutput } from '@src/types/errors';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { LoginUseCaseInput, LoginUseCaseOutput, LoginUseCaseSchema } from '../dtos';
import PasswordUtil from '@src/util/password';
import JWT from '@src/util/jwt';
import { ZodType } from 'zod';
import { EmailOrPasswordWrongError } from '@src/errors/login.errors';

type Input = LoginUseCaseInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = LoginUseCaseOutput;

export class LoginUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validationRules(): ZodType<Input> {
    return LoginUseCaseSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await this.userRepo.findByEmail(input.email);

    if (!user) {
      return wrong(new EmailOrPasswordWrongError());
    }

    const passwordCheck = await PasswordUtil.comparePasswords(input.password, user.password);

    if (!passwordCheck) {
      return wrong(new EmailOrPasswordWrongError());
    }

    const accessToken = JWT.signToken({ userId: user.id });
    const refreshToken = JWT.signToken({ userId: user.id, refresh: true });

    return right({ accessToken, refreshToken });
  }
}
