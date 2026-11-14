import { User } from '@src/generated/prisma/client';
import { BaseRepository, IBaseRepository } from '../../core/repository';
import { DbClient } from '@src/database';

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
}

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  protected model: DbClient['user'];

  constructor(prismaClient: DbClient) {
    super(prismaClient);

    this.model = prismaClient.user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({ where: { email } });
  }
}
