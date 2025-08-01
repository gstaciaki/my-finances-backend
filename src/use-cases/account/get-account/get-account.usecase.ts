import { NotFoundError } from '@src/errors/generic.errors';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { GetAccountInput, GetAccountOutput, GetAccountSchema } from '../dtos';
import { Account } from '@src/entities/account.entity';
import { GetAccountWithUsersQuery } from '@src/queries/account/get-account-with-users.query';
import { AccountMapper } from '../mapper';

type Input = GetAccountInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = GetAccountOutput;

export class GetAccountUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private getAccountWithUsersQuery: GetAccountWithUsersQuery) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return GetAccountSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const account = await this.getAccountWithUsersQuery.execute(input);

    if (!account) {
      return wrong(new NotFoundError('conta', 'id', input.id));
    }

    return right(AccountMapper.toOutput(new Account(account)));
  }
}
