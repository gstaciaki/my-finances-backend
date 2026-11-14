import { User } from '@src/entities/user.entity';
import { AlreadyExistsError, NotFoundError } from '@src/errors/generic.errors';
import { AbstractWriteUseCase } from '@src/core/write-use-case';
import { Either, right, wrong } from '@src/util/either';
import { UpdateUserInput, UpdateUserOutput, UpdateUserSchema } from '../dtos';
import { DefaultFailOutput } from '@src/types/errors';
import { ZodType } from 'zod';
import { Repositories } from '@src/database/unit-of-work';

type Input = UpdateUserInput;

type FailOutput = DefaultFailOutput;
type SuccessOutput = UpdateUserOutput;

export class UpdateUserUseCase extends AbstractWriteUseCase<Input, FailOutput, SuccessOutput> {
  protected validationRules(): ZodType<Input> {
    return UpdateUserSchema;
  }

  protected async execute(
    input: Input,
    { user: userRepo }: Repositories,
  ): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await userRepo.findById(input.id);

    if (!user) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const newEmailNotAvailable = await userRepo.findByEmail(`${input.email}`);

    if (newEmailNotAvailable) {
      return wrong(new AlreadyExistsError('usuário', 'email'));
    }

    const updatedUser = new User({
      ...user,
      ...input,
      updatedAt: new Date(),
    });

    await userRepo.update(input.id, updatedUser);

    return right(updatedUser);
  }
}
