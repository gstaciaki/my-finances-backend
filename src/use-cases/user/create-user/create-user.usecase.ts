import { AbstractWriteUseCase } from '@src/core/write-use-case';
import { Repositories } from '@src/database/unit-of-work';
import { AlreadyExistsError } from '@src/errors/generic.errors';
import { DefaultFailOutput } from '@src/types/errors';
import { Either, right, wrong } from '@src/util/either';
import { CreateUserInput, CreateUserOutput, CreateUserSchema } from '../dtos';
import { User } from '@src/entities/user.entity';
import { ZodType } from 'zod';
import PasswordUtil from '@src/util/password';

type Input = CreateUserInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = CreateUserOutput;

export class CreateUserUseCase extends AbstractWriteUseCase<Input, FailOutput, SuccessOutput> {
  protected validationRules(): ZodType<Input> {
    return CreateUserSchema;
  }

  protected async execute(
    input: Input,
    { user: userRepo }: Repositories,
  ): Promise<Either<FailOutput, SuccessOutput>> {
    const existingUser = await userRepo.findByEmail(input.email);
    if (existingUser) {
      return wrong(new AlreadyExistsError('usuário', 'email'));
    }

    const hashedPassword = await PasswordUtil.hashPassword(input.password);

    const user = new User({ ...input, password: hashedPassword });
    await userRepo.create(user);
    return right(user);
  }
}
