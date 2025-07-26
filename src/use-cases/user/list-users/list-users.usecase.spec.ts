import { ListUsersUseCase } from './list-users.usecase';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { genUser } from 'test/prefab/user';

describe('ListUsersUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    userRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findWhere: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ListUsersUseCase(userRepo);
  });

  it('should return empty data array and pagination info when no users found', async () => {
    userRepo.findWhere.mockResolvedValue([[], 0]);

    const result = await useCase.run({ page: 1, limit: 10 });

    if (result.isWrong()) fail('Expected result to be Right');

    expect(result.value).toEqual({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
    expect(userRepo.findWhere).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      filters: {},
    });
  });

  it('should return paginated users and pagination info', async () => {
    const usersRaw = [genUser(), genUser()];
    const totalCount = 20;

    userRepo.findWhere.mockResolvedValue([usersRaw, totalCount]);

    const result = await useCase.run({ page: 2, limit: 2 });

    if (result.isWrong()) fail('Expected result to be Right');

    expect(Array.isArray(result.value.data)).toBe(true);
    expect(result.value.data).toHaveLength(usersRaw.length);
    result.value.data.forEach(userOutput => {
      expect(userOutput).toHaveProperty('id');
      expect(userOutput).toHaveProperty('name');
      expect(userOutput).toHaveProperty('email');
      expect(userOutput).toHaveProperty('cpf');
      expect(userOutput).toHaveProperty('createdAt');
      expect(userOutput).toHaveProperty('updatedAt');
    });

    expect(result.value.pagination).toEqual({
      page: 2,
      limit: 2,
      total: totalCount,
      totalPages: Math.ceil(totalCount / 2),
    });

    expect(userRepo.findWhere).toHaveBeenCalledWith({
      page: 2,
      limit: 2,
      filters: {},
    });
  });
});
