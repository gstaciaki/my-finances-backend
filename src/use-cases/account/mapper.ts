import { AccountWithUsers } from '@src/types/account';
import { OutputAccount } from './dtos';
import { UserMapper } from '../user/mapper';

export class AccountMapper {
  static toOutput(accountWithUsers: AccountWithUsers): OutputAccount {
    return {
      ...accountWithUsers,
      users: accountWithUsers.users?.map(accountUser => UserMapper.toOutput(accountUser)) ?? [],
    };
  }
}
