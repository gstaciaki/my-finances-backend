import { User } from '@src/entities/user.entity';
import { IUserRepository } from '@src/repositories/user.repository';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right } from '@src/util/either';
import { ListUsersInput, ListUsersOutput, ListUsersSchema } from './dtos';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { autoParseFilters } from '@src/util/prisma/parse-filters';
import { UserMapper } from './mapper';

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

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const { page = 1, limit = 10, ...rawFilters } = input;

    const [users, total] = await this.userRepo.findWhere({
      page,
      limit,
      filters: autoParseFilters(rawFilters),
    });

    const domainUsers = users.map(user => new User(user));

    return right({
      data: domainUsers.map(UserMapper.toOutput),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}
