import { User } from '@src/entities/user.entity';
import { NotFoundError } from '@src/errors/generic.errors';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { AbstractUseCase } from '@src/core/use-case';
import { Either, right, wrong } from '@src/util/either';
import { ShowUserInput, ShowUserOutput, ShowUserSchema } from '../dtos';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';

type Input = ShowUserInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = ShowUserOutput;

export class ShowUserUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return ShowUserSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await this.userRepo.findById(input.id);

    if (!user) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const domainUser = new User(user);
    return right(domainUser);
  }
}
