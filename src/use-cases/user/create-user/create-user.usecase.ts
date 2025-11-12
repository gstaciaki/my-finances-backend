import { AbstractUseCase } from '@src/core/use-case';
import { AlreadyExistsError } from '@src/errors/generic.errors';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { DefaultFailOutput } from '@src/types/errors';
import { Either, right, wrong } from '@src/util/either';
import { CreateUserInput, CreateUserOutput, CreateUserSchema } from '../dtos';
import { User } from '@src/entities/user.entity';
import { ZodSchema } from 'zod';
import PasswordUtil from '@src/util/password';

type Input = CreateUserInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = CreateUserOutput;

export class CreateUserUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return CreateUserSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      return wrong(new AlreadyExistsError('usuário', 'email'));
    }

    const hashedPassword = await PasswordUtil.hashPassword(input.password);
    const user = new User({ ...input, password: hashedPassword });
    await this.userRepo.create(user);
    return right(user);
  }
}
