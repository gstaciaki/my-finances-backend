import { PrismaClient } from '@prisma/client';
import { PaginatorParams } from '@src/types/paginator';

export interface IBaseRepository<T> {
  create(data: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  findWhere(params: PaginatorParams): Promise<[T[], number]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  // eslint-disable-next-line
  protected abstract model: any;
  protected prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  async create(data: T): Promise<T> {
    return this.model.create({ data });
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  async findWhere(params: PaginatorParams): Promise<[T[], number]> {
    const { page = 1, limit = 10, filters = {} } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prismaClient.$transaction([
      this.model.findMany({
        where: filters,
        skip,
        take: limit,
      }),
      this.model.count({ where: filters }),
    ]);

    return [data, total];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ where: { id } });
  }
}
