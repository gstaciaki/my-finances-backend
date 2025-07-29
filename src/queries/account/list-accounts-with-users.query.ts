import { BaseQuery } from '../base.query';
import { autoParseFilters } from '@src/util/prisma/parse-filters';
import { AccountWithUsers } from '@src/types/account';
import { PaginatorParams } from '@src/types/paginator';

type Input = PaginatorParams;

type Output = {
  data: AccountWithUsers[];
  total: number;
};

export class ListAccountsWithUsersQuery extends BaseQuery<Input, Output> {
  async execute(input: Input): Promise<Output> {
    const { page = 1, limit = 10, filters = {} } = input;

    const where = autoParseFilters(filters);

    const [accountsData, total] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        where,
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.account.count({ where }),
    ]);

    const accounts = accountsData.map(account => ({
      ...account,
      users: account.users.map(userAccount => userAccount.user),
    }));

    return { data: accounts, total };
  }
}
