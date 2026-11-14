import { User } from '@src/entities/user.entity';
import { NotFoundError } from '@src/errors/generic.errors';
import { AbstractWriteUseCase } from '@src/core/write-use-case';
import { Either, right, wrong } from '@src/util/either';
import { DeleteUserInput, DeleteUserOutput, DeleteUserSchema } from '../dtos';
import { ZodType } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { Repositories } from '@src/database/unit-of-work';

type Input = DeleteUserInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = DeleteUserOutput;

export class DeleteUserUseCase extends AbstractWriteUseCase<Input, FailOutput, SuccessOutput> {
  protected validationRules(): ZodType<Input> {
    return DeleteUserSchema;
  }

  protected async execute(
    input: Input,
    { user: userRepo }: Repositories,
  ): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await userRepo.findById(input.id);

    if (!user) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const domainUser = new User(user);

    await userRepo.delete(domainUser.id);

    return right(domainUser);
  }
}
