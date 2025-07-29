import { Account, PrismaClient } from '@prisma/client';
import { BaseRepository, IBaseRepository } from '../_base/repository';

export interface IAccountRepository extends IBaseRepository<Account> {}

export class AccountRepository extends BaseRepository<Account> implements IAccountRepository {
  protected model: PrismaClient['account'];

  constructor(prismaClient: PrismaClient) {
    super(prismaClient);
    this.model = prismaClient.account;
  }
}
