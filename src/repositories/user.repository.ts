import { User } from "@prisma/client";
import { prisma } from "../database";
import { BaseRepository, IBaseRepository } from "./_base/repository";

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
}

export class UserRepository
  extends BaseRepository<User>
  implements IUserRepository
{
  protected model = prisma.user;

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({ where: { email } });
  }
}
