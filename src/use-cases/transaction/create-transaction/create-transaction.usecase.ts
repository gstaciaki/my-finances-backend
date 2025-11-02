import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { DefaultFailOutput } from '@src/types/errors';
import { Either, right, wrong } from '@src/util/either';
import { CreateTransactionInput, CreateTransactionOutput, CreateTransactionSchema } from '../dtos';
import { ZodSchema } from 'zod';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { Transaction } from '@src/entities/transaction.entity';
import { Account } from '@src/entities/account.entity';

type Input = CreateTransactionInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = CreateTransactionOutput;

export class CreateTransactionUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(
    private readonly transactionRepo: ITransacationRepository,
    private readonly accountRepo: IAccountRepository,
  ) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return CreateTransactionSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const account = await this.accountRepo.findById(input.accountId);

    if (!account) {
      return wrong(new NotFoundError('conta', 'id', input.accountId));
    }

    const transaction = new Transaction({ ...input, account: new Account(account) });

    await this.transactionRepo.create({ ...transaction, accountId: account.id });

    return right(transaction);
  }
}
