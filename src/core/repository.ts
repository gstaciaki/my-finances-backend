import { DbClient } from '@src/database';
import { PaginatorParams } from '@src/types/paginator';

export interface IBaseRepository<T> {
  create(data: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  findWhere(params: PaginatorParams): Promise<[T[], number]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface ModelDelegate<T> {
  create(args: { data: T }): Promise<T>;
  findUnique(args: { where: { id: string } }): Promise<T | null>;
  findMany(args?: { where?: Record<string, unknown>; skip?: number; take?: number }): Promise<T[]>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
  update(args: { where: { id: string }; data: Partial<T> }): Promise<T>;
  delete(args: { where: { id: string } }): Promise<unknown>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected abstract model: ModelDelegate<T>;
  protected prismaClient: DbClient;

  constructor(prismaClient: DbClient) {
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
    const { page, limit, filters = {} } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({ where: filters, skip, take: limit }),
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
