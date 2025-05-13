import { randomUUID } from 'crypto';
import { UserRepository } from './user.repository';
import { User } from '@src/entities/user.entity';
import { setupDatabaseLifecycle } from 'test/helpers/base-test';
import { genCpf } from 'test/helpers/faker';

setupDatabaseLifecycle();

describe('UserRepository', () => {
  const repository = new UserRepository();

  const fakeUserData = () =>
    new User({
      id: randomUUID(),
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'hashed-password',
      cpf: genCpf(),
    });

  it('should create a user', async () => {
    const data = fakeUserData();
    const created = await repository.create(data);
    expect(new User(created)).toStrictEqual(data);
  });

  it('should find a user by id', async () => {
    const data = fakeUserData();
    await repository.create(data);

    const found = await repository.findById(data.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(data.id);
  });

  it('should find a user by email', async () => {
    const data = fakeUserData();
    await repository.create(data);

    const found = await repository.findByEmail(data.email);
    expect(found).not.toBeNull();
    expect(found?.email).toBe(data.email);
  });

  it('should update a user', async () => {
    const data = fakeUserData();
    await repository.create(data);

    const updated = await repository.update(data.id, { name: 'Updated Name' });
    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a user', async () => {
    const data = fakeUserData();
    await repository.create(data);

    await repository.delete(data.id);
    const found = await repository.findById(data.id);
    expect(found).toBeNull();
  });

  it('should return all users', async () => {
    await repository.create(fakeUserData());
    await repository.create(fakeUserData());

    const users = await repository.findAll();
    expect(users.length).toEqual(2);
  });
});
