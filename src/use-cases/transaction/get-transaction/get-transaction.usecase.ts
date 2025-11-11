import { NotFoundError } from '@src/errors/generic.errors';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';
import { GetTransactionInput, GetTransactionOutput, GetTransactionSchema } from '../dtos';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { Transaction } from '@src/entities/transaction.entity';
import { Account } from '@src/entities/account.entity';

type Input = GetTransactionInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = GetTransactionOutput;

export class GetTransactionUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly transactionRepo: ITransacationRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return GetTransactionSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const transaction = await this.transactionRepo.findById(input.id);

    if (!transaction) {
      return wrong(new NotFoundError('transação', 'id', input.id));
    }

    return right(new Transaction({ ...transaction, account: new Account(transaction.account) }));
  }
}

