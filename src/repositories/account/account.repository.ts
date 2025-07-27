import { Account, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository, IBaseRepository } from '../_base/repository';
import { PaginatorParams } from '@src/types/paginator';

export type AccountWithUsers = Prisma.AccountGetPayload<{
  include: {
    users: {
      include: {
        user: true;
      };
    };
  };
}>;

export interface IAccountRepository extends IBaseRepository<Account> {
  findById(id: string): Promise<AccountWithUsers | null>;
  findWhere(params: PaginatorParams): Promise<[AccountWithUsers[], number]>;
}

export class AccountRepository extends BaseRepository<Account> implements IAccountRepository {
  protected model: PrismaClient['account'];

  constructor(prismaClient: PrismaClient) {
    super(prismaClient);
    this.model = prismaClient.account;
  }

  async findById(id: string): Promise<AccountWithUsers | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findWhere(params: PaginatorParams): Promise<[AccountWithUsers[], number]> {
    const { page = 1, limit = 10, filters = {} } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prismaClient.$transaction([
      this.model.findMany({
        where: filters,
        skip,
        take: limit,
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
      }),
      this.model.count({ where: filters }),
    ]);

    return [data, total];
  }
}
