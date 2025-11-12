import { NotFoundError } from '@src/errors/generic.errors';
import { AbstractUseCase } from '@src/core/use-case';
import { Either, right, wrong } from '@src/util/either';
import { ZodType } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { GetTransactionInput, GetTransactionOutput, GetTransactionSchema } from '../dtos';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { Transaction } from '@src/entities/transaction.entity';
import { Account } from '@src/entities/account.entity';
import { IAccountRepository } from '@src/repositories/account/account.repository';

type Input = GetTransactionInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = GetTransactionOutput;

export class GetTransactionUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(
    private readonly transactionRepo: ITransacationRepository,
    private readonly accountRepo: IAccountRepository,
  ) {
    super();
  }

  protected validationRules(): ZodType<Input> {
    return GetTransactionSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const account = await this.accountRepo.findById(input.accountId);

    if (!account) {
      return wrong(new NotFoundError('conta', 'id', input.accountId));
    }

    const transaction = await this.transactionRepo.findById(input.id);

    if (!transaction || transaction.accountId !== input.accountId) {
      return wrong(new NotFoundError('transação', 'id', input.id));
    }

    return right(
      new Transaction({ ...transaction, account: new Account(transaction.account) }).toOutput(),
    );
  }
}
