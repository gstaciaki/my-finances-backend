import { AccountWithUsers } from '@src/types/account';
import { BaseQuery } from '../base.query';
import { User } from '@src/entities/user.entity';

type Input = {
  id: string;
};

type Output = AccountWithUsers | null;

export class GetAccountWithUsersQuery extends BaseQuery<Input, Output> {
  async execute(input: Input): Promise<Output> {
    const account = await this.prisma.account.findUnique({
      where: { id: input.id },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!account) return null;

    return {
      ...account,
      users: account.users.map(userAccount => new User(userAccount.user)),
    };
  }
}
