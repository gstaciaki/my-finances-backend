import { Account } from '@src/entities/account.entity';
import { User } from '@src/entities/user.entity';
import { AccountWithUsers } from '@src/repositories/account/account.repository';

export class AccountMapper {
  static toPrisma(account: Account, users: User[] = []): AccountWithUsers {
    return {
      ...account,
      users: users.map(user => ({ accountId: account.id, user, userId: user.id })),
    };
  }

  static fromPrisma(account: AccountWithUsers): Account {
    const { id, name, createdAt, updatedAt, users } = account;
    return new Account({
      id,
      name,
      createdAt,
      updatedAt,
      users: users.map(user => user.user),
    });
  }
}
