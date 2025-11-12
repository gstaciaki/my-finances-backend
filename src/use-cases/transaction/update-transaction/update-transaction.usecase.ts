import { NotFoundError } from '@src/errors/generic.errors';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { DefaultFailOutput } from '@src/types/errors';
import { ZodSchema } from 'zod';
import { UpdateTransactionInput, UpdateTransactionOutput, UpdateTransactionSchema } from '../dtos';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { Transaction } from '@src/entities/transaction.entity';
import { Account } from '@src/entities/account.entity';
import { IAccountRepository } from '@src/repositories/account/account.repository';

type Input = UpdateTransactionInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = UpdateTransactionOutput;

export class UpdateTransactionUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(
    private readonly transactionRepo: ITransacationRepository,
    private readonly accountRepo: IAccountRepository,
  ) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return UpdateTransactionSchema;
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

    const updatedTransaction = new Transaction({
      ...transaction,
      ...input,
      account: new Account(transaction.account),
      updatedAt: new Date(),
    });

    await this.transactionRepo.update(input.id, updatedTransaction.toPrismaInput());

    return right(updatedTransaction.toOutput());
  }
}
