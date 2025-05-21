import { ListUsersUseCase } from './list-users.usecase';
import { IUserRepository } from '@src/repositories/user.repository';
import { genUser } from 'test/prefab/user';
import { User } from '@src/entities/user.entity';

describe('ListUsersUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    userRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ListUsersUseCase(userRepo);
  });

  it('should return an empty array if no users are found', async () => {
    userRepo.findAll.mockResolvedValue([]);

    const result = await useCase.run({});

    if (result.isWrong()) fail('Expected result to be Right');
    expect(result.value).toEqual([]);
    expect(userRepo.findAll).toHaveBeenCalled();
  });

  it('should return a list of users as User entities', async () => {
    const users = [genUser(), genUser()];
    userRepo.findAll.mockResolvedValue(users);

    const result = await useCase.run({});

    if (result.isWrong()) fail('Expected result to be Right');
    expect(Array.isArray(result.value)).toBe(true);
    expect(result.value).toHaveLength(2);
    expect(result.value[0]).toBeInstanceOf(User);
    expect(result.value[1]).toBeInstanceOf(User);
    expect(userRepo.findAll).toHaveBeenCalled();
  });
});
