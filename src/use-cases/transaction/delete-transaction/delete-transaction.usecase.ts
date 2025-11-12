import { Transaction } from '@src/entities/transaction.entity';
import { Account } from '@src/entities/account.entity';
import { NotFoundError } from '@src/errors/generic.errors';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { AbstractUseCase } from '@src/core/use-case';
import { Either, right, wrong } from '@src/util/either';
import { DeleteTransactionInput, DeleteTransactionOutput, DeleteTransactionSchema } from '../dtos';
import { ZodType } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { IAccountRepository } from '@src/repositories/account/account.repository';

type Input = DeleteTransactionInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = DeleteTransactionOutput;

export class DeleteTransactionUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(
    private readonly transactionRepo: ITransacationRepository,
    private readonly accountRepo: IAccountRepository,
  ) {
    super();
  }

  protected validationRules(): ZodType<Input> {
    return DeleteTransactionSchema;
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

    const domainTransaction = new Transaction({
      ...transaction,
      account: new Account(transaction.account),
    });

    await this.transactionRepo.delete(domainTransaction.id);

    return right(domainTransaction.toOutput());
  }
}
