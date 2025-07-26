import { UpdateUserUseCase } from './update-user.usecase';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { genUser } from 'test/prefab/user';
import { AlreadyExistsError, NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { User } from '@src/entities/user.entity';

describe('UpdateUserUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: UpdateUserUseCase;

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

    useCase = new UpdateUserUseCase(userRepo);
  });

  it('should return InputValidationError if id is invalid', async () => {
    const input = {
      id: 'invalid-id',
      email: 'new@email.com',
      name: 'Updated Name',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findById).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if email is invalid', async () => {
    const input = {
      id: 'a08f0dd7-bec7-4c0b-b065-aaa9f7683be6',
      email: 'invalid',
      name: 'Updated Name',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findById).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if name is invalid', async () => {
    const input = {
      id: 'a08f0dd7-bec7-4c0b-b065-aaa9f7683be6',
      email: 'new@email.com',
      name: '',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findById).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should return NotFoundError if user does not exist', async () => {
    const input = {
      id: 'a08f0dd7-bec7-4c0b-b065-aaa9f7683be6',
      email: 'new@email.com',
      name: 'Updated Name',
    };

    userRepo.findById.mockResolvedValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should return AlreadyExistsError if email is already taken', async () => {
    const existingUser = genUser();
    const input = {
      id: existingUser.id,
      email: 'already@used.com',
      name: 'Updated Name',
    };

    userRepo.findById.mockResolvedValue(existingUser);
    userRepo.findByEmail.mockResolvedValue(genUser({ email: input.email }));

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(AlreadyExistsError);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should update user and return updated User entity', async () => {
    const existingUser = genUser();
    const input = {
      id: existingUser.id,
      email: 'new@email.com',
      name: 'Updated Name',
    };

    userRepo.findById.mockResolvedValue(existingUser);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.update.mockResolvedValue({ ...existingUser, ...input });

    const result = await useCase.run(input);

    if (result.isWrong()) fail('Expected result to be Right');

    expect(result.value).toBeInstanceOf(User);
    expect(result.value.id).toBe(existingUser.id);
    expect(result.value.email).toBe(input.email);
    expect(result.value.name).toBe(input.name);
    expect(userRepo.update).toHaveBeenCalledWith(
      input.id,
      expect.objectContaining({
        email: input.email,
        name: input.name,
      }),
    );
  });
});
