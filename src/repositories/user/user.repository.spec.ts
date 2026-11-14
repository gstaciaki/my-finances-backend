import { prisma, prismaRaw } from '@src/database';
import { User } from '@src/entities/user.entity';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { runAsActor } from 'test/helpers/run-as-actor';
import { genActor } from 'test/prefab/actor';
import { genUser } from 'test/prefab/user';
import { UserRepository } from './user.repository';

setupDatabaseLifecycle();

// Usa o cliente estendido de verdade: toda escrita roda em transação, com actor,
// e deixa AuditLog. As leituras também passam pelo mesmo cliente.
const withRepository = <T>(fn: (repository: UserRepository) => Promise<T>) =>
  runAsActor(genActor(), tx => fn(new UserRepository(tx)));

describe('UserRepository', () => {
  it('should create a user', async () => {
    const data = genUser();
    const created = await withRepository(repository => repository.create(data));
    expect(new User(created)).toStrictEqual(data);
  });

  it('should find a user by id', async () => {
    const data = genUser();
    const found = await withRepository(async repository => {
      await repository.create(data);
      return repository.findById(data.id);
    });
    expect(found).not.toBeNull();
    expect(found?.id).toBe(data.id);
  });

  it('should find a user by email', async () => {
    const data = genUser();
    const found = await withRepository(async repository => {
      await repository.create(data);
      return repository.findByEmail(data.email);
    });
    expect(found).not.toBeNull();
    expect(found?.email).toBe(data.email);
  });

  it('should update a user', async () => {
    const data = genUser();
    const updated = await withRepository(async repository => {
      await repository.create(data);
      return repository.update(data.id, { name: 'Updated Name' });
    });
    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a user', async () => {
    const data = genUser();
    const found = await withRepository(async repository => {
      await repository.create(data);
      await repository.delete(data.id);
      return repository.findById(data.id);
    });
    expect(found).toBeNull();
  });

  it('should return all users', async () => {
    const users = await withRepository(async repository => {
      await repository.create(genUser());
      await repository.create(genUser());
      return repository.findAll();
    });
    expect(users.length).toEqual(2);
  });

  it('should paginate with findWhere returning the page and the total', async () => {
    await withRepository(async repository => {
      for (let i = 0; i < 3; i++) await repository.create(genUser());
    });

    const [data, total] = await withRepository(repository =>
      repository.findWhere({ page: 1, limit: 2 }),
    );

    expect(data).toHaveLength(2);
    expect(total).toBe(3);
  });

  it('should audit every write made through the repository', async () => {
    const data = genUser();
    await withRepository(async repository => {
      await repository.create(data);
      await repository.update(data.id, { name: 'Novo' });
      await repository.delete(data.id);
    });

    const rows = await prismaRaw.auditLog.findMany({ orderBy: { at: 'asc' } });
    expect(rows.map(r => r.operation)).toEqual(['create', 'update', 'delete']);
  });

  it('should refuse to write through a repository outside of a transaction', async () => {
    const repository = new UserRepository(prisma);

    await expect(repository.create(genUser())).rejects.toThrow('Forbidden Operation');
    expect(await prismaRaw.user.count()).toBe(0);
  });
});
