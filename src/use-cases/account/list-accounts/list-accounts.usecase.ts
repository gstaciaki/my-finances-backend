import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right } from '@src/util/either';
import { ListAccountsInput, ListAccountsOutput, ListAccountsSchema } from '../dtos';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { autoParseFilters } from '@src/util/prisma/parse-filters';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { Account } from '@src/entities/account.entity';
import { User } from '@src/entities/user.entity';

type Input = ListAccountsInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = ListAccountsOutput;

export class ListAccountsUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly accountRepo: IAccountRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return ListAccountsSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const { page = 1, limit = 10, ...rawFilters } = input;

    const [accounts, total] = await this.accountRepo.findWhere({
      page,
      limit,
      filters: autoParseFilters(rawFilters),
    });

    const domainAccounts = accounts.map(
      account =>
        new Account({
          ...account,
          users: account.users.map(userAccount => new User(userAccount.user)),
        }),
    );

    return right({
      data: domainAccounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}
