import { Prisma, Transaction } from '@src/generated/prisma/client';
import { DbClient } from '@src/database';
import { BaseRepository, IBaseRepository } from '../../core/repository';

type TransactionWithAccount = Prisma.TransactionGetPayload<{
  include: { account: true };
}>;

export interface ITransacationRepository extends IBaseRepository<Transaction> {
  findById(id: string): Promise<TransactionWithAccount | null>;
}

export class TransactionRepository
  extends BaseRepository<Transaction>
  implements ITransacationRepository
{
  protected model: DbClient['transaction'];

  constructor(prismaClient: DbClient) {
    super(prismaClient);
    this.model = prismaClient.transaction;
  }

  async findById(id: string): Promise<TransactionWithAccount | null> {
    return this.model.findUnique({
      where: { id },
      include: { account: true },
    });
  }
}
