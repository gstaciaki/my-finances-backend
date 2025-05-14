import { User } from '@src/entities/user.entity';
import { IUserRepository } from '@src/repositories/user.repository';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right } from '@src/util/either';
import { ListUsersInput, ListUsersOutput, ListUsersSchema } from './dtos';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';

type Input = ListUsersInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = ListUsersOutput;

export class ListUsersUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return ListUsersSchema;
  }

  protected async execute(): Promise<Either<FailOutput, SuccessOutput>> {
    const users = await this.userRepo.findAll();
    const domainUsers = users.map(user => new User(user));

    return right(domainUsers);
  }
}
