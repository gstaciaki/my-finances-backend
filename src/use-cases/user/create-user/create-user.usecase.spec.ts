import { AlreadyExistsError } from '@src/errors/generic.errors';
import { IUserRepository } from '@src/repositories/user/user.repository';
import PasswordUtil from '@src/util/password';
import { User } from '@src/entities/user.entity';
import { CreateUserUseCase } from './create-user.usecase';
import { genUser } from 'test/prefab/user';
import { cpf } from 'test/prefab/cpf';
import { InputValidationError } from '@src/errors/input-validation.error';

describe('CreateUserUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: CreateUserUseCase;

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

    useCase = new CreateUserUseCase(userRepo);
  });

  it('should return AlreadyExistsError if user already exists', async () => {
    const input = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Teste',
      cpf: cpf(),
    };

    userRepo.findByEmail.mockResolvedValue(genUser());

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(AlreadyExistsError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if password does not meet password requiriments', async () => {
    const input = {
      email: 'test@example.com',
      password: 'weakPassword',
      name: 'Teste',
      cpf: cpf(),
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if email is invalid', async () => {
    const input = {
      email: 'invalid',
      password: 'Password123!',
      name: 'Teste',
      cpf: cpf(),
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if cpf is invalid', async () => {
    const input = {
      email: 'invalid',
      password: 'Password123!',
      name: 'Teste',
      cpf: '00000000000',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if name is invalid', async () => {
    const input = {
      email: 'invalid',
      password: 'Password123!',
      name: '',
      cpf: '00000000000',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should create a new user with hashed password', async () => {
    const input = {
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'Novo Usuário',
      cpf: cpf(),
    };

    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(genUser());

    jest.spyOn(PasswordUtil, 'hashPassword').mockResolvedValue('hashedPassword');

    const result = await useCase.run(input);

    if (result.isWrong()) fail('Expected result to be Right');
    expect(result.value).toBeInstanceOf(User);
    expect(result.value.password).toBe('hashedPassword');
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: input.email,
        password: 'hashedPassword',
        name: input.name,
      }),
    );
  });
});
