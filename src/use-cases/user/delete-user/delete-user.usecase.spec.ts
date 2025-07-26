import { DeleteUserUseCase } from './delete-user.usecase';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { genUser } from 'test/prefab/user';
import { InputValidationError } from '@src/errors/input-validation.error';
import { User } from '@src/entities/user.entity';

describe('DeleteUserUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: DeleteUserUseCase;

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

    useCase = new DeleteUserUseCase(userRepo);
  });

  it('should return InputValidationError if id is not a valid UUID', async () => {
    const input = { id: 'invalid-id' };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findById).not.toHaveBeenCalled();
    expect(userRepo.delete).not.toHaveBeenCalled();
  });

  it('should return NotFoundError if user is not found', async () => {
    const input = { id: '9e6cb5ce-b3b7-4203-b3e7-4d2d97c8e2a9' };

    userRepo.findById.mockResolvedValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
    expect(userRepo.delete).not.toHaveBeenCalled();
  });

  it('should delete user and return User entity', async () => {
    const existingUser = genUser();
    const input = { id: existingUser.id };

    userRepo.findById.mockResolvedValue(existingUser);
    userRepo.delete.mockResolvedValue(undefined);

    const result = await useCase.run(input);

    if (result.isWrong()) fail('Expected result to be Right');
    expect(result.value).toBeInstanceOf(User);
    expect(result.value.id).toBe(existingUser.id);
    expect(userRepo.findById).toHaveBeenCalledWith(input.id);
    expect(userRepo.delete).toHaveBeenCalledWith(input.id);
  });
});
