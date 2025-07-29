import { NotFoundError } from '@src/errors/generic.errors';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { DefaultFailOutput } from '@src/types/errors';
import { ZodSchema } from 'zod';
import { UpdateAccountInput, UpdateAccountOutput, UpdateAccountSchema } from '../dtos';
import { IAccountRepository } from '@src/repositories/account/account.repository';
import { Account } from '@src/entities/account.entity';

type Input = UpdateAccountInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = UpdateAccountOutput;

export class UpdateAccountUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly accountRepo: IAccountRepository) {
    super();
  }

  protected validationRules(): ZodSchema<Input> {
    return UpdateAccountSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const account = await this.accountRepo.findById(input.id);

    if (!account) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const updatedAccount = new Account({
      ...account,
      ...input,
      updatedAt: new Date(),
    });

    const { users, ...updatedAccountData } = updatedAccount;

    await this.accountRepo.update(input.id, updatedAccountData);

    return right(updatedAccount);
  }
}
