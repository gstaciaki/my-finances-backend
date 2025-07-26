import { UserRepository } from './user.repository';
import { User } from '@src/entities/user.entity';
import { prismaTest } from 'jest.setup';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { genUser } from 'test/prefab/user';

setupDatabaseLifecycle();

describe('UserRepository', () => {
  const repository = new UserRepository(prismaTest);

  it('should create a user', async () => {
    const data = genUser();
    const created = await repository.create(data);
    expect(new User(created)).toStrictEqual(data);
  });

  it('should find a user by id', async () => {
    const data = genUser();
    await repository.create(data);

    const found = await repository.findById(data.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(data.id);
  });

  it('should find a user by email', async () => {
    const data = genUser();
    await repository.create(data);

    const found = await repository.findByEmail(data.email);
    expect(found).not.toBeNull();
    expect(found?.email).toBe(data.email);
  });

  it('should update a user', async () => {
    const data = genUser();
    await repository.create(data);

    const updated = await repository.update(data.id, { name: 'Updated Name' });
    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a user', async () => {
    const data = genUser();
    await repository.create(data);

    await repository.delete(data.id);
    const found = await repository.findById(data.id);
    expect(found).toBeNull();
  });

  it('should return all users', async () => {
    await repository.create(genUser());
    await repository.create(genUser());

    const users = await repository.findAll();
    expect(users.length).toEqual(2);
  });
});
