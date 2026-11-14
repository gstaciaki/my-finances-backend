import { Account } from '@src/generated/prisma/client';
import { DbClient } from '@src/database';
import { BaseRepository, IBaseRepository } from '../../core/repository';

// eslint-disable-next-line
export interface IAccountRepository extends IBaseRepository<Account> {}

export class AccountRepository extends BaseRepository<Account> implements IAccountRepository {
  protected model: DbClient['account'];

  constructor(prismaClient: DbClient) {
    super(prismaClient);
    this.model = prismaClient.account;
  }
}
