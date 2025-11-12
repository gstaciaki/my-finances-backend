import { AbstractUseCase } from '@src/core/use-case';
import { Either, right } from '@src/util/either';
import { ListAccountsInput, ListAccountsOutput, ListAccountsSchema } from '../dtos';
import { ZodType } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { autoParseFilters } from '@src/util/prisma/parse-filters';

import { ListAccountsWithUsersQuery } from '@src/queries/account/list-accounts-with-users.query';
import { AccountMapper } from '../mapper';

type Input = ListAccountsInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = ListAccountsOutput;

export class ListAccountsUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly listAccountsWithUsersQuery: ListAccountsWithUsersQuery) {
    super();
  }

  protected validationRules(): ZodType<Input> {
    return ListAccountsSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const { page, limit, ...rawFilters } = input;

    const { data: accounts, total } = await this.listAccountsWithUsersQuery.execute({
      page,
      limit,
      filters: autoParseFilters(rawFilters),
    });

    return right({
      data: accounts.map(account => AccountMapper.toOutput(account)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}
