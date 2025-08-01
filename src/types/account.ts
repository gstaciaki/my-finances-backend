import { Account } from '@src/entities/account.entity';
import { User } from '@src/entities/user.entity';

export type AccountWithUsers = Account & {
  users?: User[];
};
