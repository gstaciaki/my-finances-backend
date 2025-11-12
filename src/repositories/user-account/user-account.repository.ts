import { PrismaClient, UserAccount } from '@prisma/client';
import { BaseRepository, IBaseRepository } from '../../core/repository';

// eslint-disable-next-line
export interface IUserAccountRepository extends IBaseRepository<UserAccount> {}

export class UserAccountRepository
  extends BaseRepository<UserAccount>
  implements IUserAccountRepository
{
  protected model: PrismaClient['userAccount'];

  constructor(prismaClient: PrismaClient) {
    super(prismaClient);
    this.model = prismaClient.userAccount;
  }
}
