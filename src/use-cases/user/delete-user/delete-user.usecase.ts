import { User } from '@src/entities/user.entity';
import { NotFoundError } from '@src/errors/generic.errors';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { DeleteUserInput, DeleteUserOutput, DeleteUserSchema } from '../dtos';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';

type Input = DeleteUserInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = DeleteUserOutput;

export class DeleteUserUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return DeleteUserSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await this.userRepo.findById(input.id);

    if (!user) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const domainUser = new User(user);

    await this.userRepo.delete(domainUser.id);

    return right(domainUser);
  }
}
