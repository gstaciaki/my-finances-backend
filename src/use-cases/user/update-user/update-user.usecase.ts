import { User } from '@src/entities/user.entity';
import { AlreadyExistsError, NotFoundError } from '@src/errors/generic.errors';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { AbstractUseCase } from '@src/core/use-case';
import { Either, right, wrong } from '@src/util/either';
import { UpdateUserInput, UpdateUserOutput, UpdateUserSchema } from '../dtos';
import { DefaultFailOutput } from '@src/types/errors';
import { ZodSchema } from 'zod';

type Input = UpdateUserInput;

type FailOutput = DefaultFailOutput;
type SuccessOutput = UpdateUserOutput;

export class UpdateUserUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return UpdateUserSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await this.userRepo.findById(input.id);

    if (!user) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const newEmailNotAvailable = await this.userRepo.findByEmail(`${input.email}`);

    if (newEmailNotAvailable) {
      return wrong(new AlreadyExistsError('usuário', 'email'));
    }

    const updatedUser = new User({
      ...user,
      ...input,
      updatedAt: new Date(),
    });

    await this.userRepo.update(input.id, updatedUser);

    return right(updatedUser);
  }
}
