import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { ListTransactionsInput, ListTransactionsOutput, ListTransactionsSchema } from '../dtos';
import { ZodType } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { autoParseFilters } from '@src/util/prisma/parse-filters';
import { Transaction } from '@src/entities/transaction.entity';
import { Account } from '@src/entities/account.entity';
import { NotFoundError } from '@src/errors/generic.errors';
import { getPaginationData } from '@src/util/pagination';

type Input = ListTransactionsInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = ListTransactionsOutput;

export class ListTransactionsUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(
    private readonly transactionRepo: ITransacationRepository,
    private readonly accountRepo: IAccountRepository,
  ) {
    super();
  }

  protected validationRules(): ZodType<Input> {
    return ListTransactionsSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const { page, limit, accountId, ...rawFilters } = input;

    const account = await this.accountRepo.findById(accountId);

    if (!account) {
      return wrong(new NotFoundError('conta', 'id', accountId));
    }

    const [transactions, total] = await this.transactionRepo.findWhere({
      page,
      limit,
      filters: autoParseFilters(rawFilters),
    });

    const domainTransactions = transactions.map(
      t => new Transaction({ ...t, account: new Account(account) }),
    );

    return right(
      getPaginationData(
        domainTransactions.map(dt => dt.toOutput()),
        page,
        limit,
        total,
      ),
    );
  }
}
