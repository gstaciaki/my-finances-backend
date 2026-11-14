import { UserAccount } from '@src/generated/prisma/client';
import { DbClient } from '@src/database';
import { BaseRepository, IBaseRepository } from '../../core/repository';

// eslint-disable-next-line
export interface IUserAccountRepository extends IBaseRepository<UserAccount> {}

export class UserAccountRepository
  extends BaseRepository<UserAccount>
  implements IUserAccountRepository
{
  protected model: DbClient['userAccount'];

  constructor(prismaClient: DbClient) {
    super(prismaClient);
    this.model = prismaClient.userAccount;
  }
}
