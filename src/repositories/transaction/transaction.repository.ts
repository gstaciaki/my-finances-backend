import { PrismaClient, Transaction } from '@prisma/client';
import { BaseRepository, IBaseRepository } from '../_base/repository';

export interface ITransacationRepository extends IBaseRepository<Transaction> {}

export class TransactionRepository
  extends BaseRepository<Transaction>
  implements ITransacationRepository
{
  protected model: PrismaClient['transaction'];

  constructor(prismaClient: PrismaClient) {
    super(prismaClient);
    this.model = prismaClient.transaction;
  }
}
