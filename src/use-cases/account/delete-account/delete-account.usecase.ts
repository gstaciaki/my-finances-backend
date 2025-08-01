import { Account } from '@src/entities/account.entity';
import { NotFoundError } from '@src/errors/generic.errors';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { DeleteAccountInput, DeleteAccountOutput, DeleteAccountSchema } from '../dtos';
import { ZodSchema } from 'zod';
import { DefaultFailOutput } from '@src/types/errors';

type Input = DeleteAccountInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = DeleteAccountOutput;

export class DeleteAccountUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly accountRepo: IAccountRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return DeleteAccountSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const account = await this.accountRepo.findById(input.id);

    if (!account) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const domainAccount = new Account(account);

    await this.accountRepo.delete(domainAccount.id);

    return right(domainAccount);
  }
}
