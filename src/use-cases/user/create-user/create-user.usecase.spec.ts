import { AlreadyExistsError } from '@src/errors/generic.errors';
import { IUserRepository } from '@src/repositories/user/user.repository';
import PasswordUtil from '@src/util/password';
import { User } from '@src/entities/user.entity';
import { CreateUserUseCase } from './create-user.usecase';
import { genUser } from 'test/prefab/user';
import { genActor } from 'test/prefab/actor';
import { FakeUnitOfWork } from 'test/helpers/fake-unit-of-work';
import { UnknownError } from '@src/errors/unknow.error';
import { InputValidationError } from '@src/errors/input-validation.error';

describe('CreateUserUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let uow: FakeUnitOfWork;
  let useCase: CreateUserUseCase;
  const actor = genActor();

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

    uow = new FakeUnitOfWork({ user: userRepo });
    useCase = new CreateUserUseCase(uow);
  });

  it('should return AlreadyExistsError if user already exists', async () => {
    const input = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Teste',
    };

    userRepo.findByEmail.mockResolvedValue(genUser());

    const result = await useCase.run(input, actor);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(AlreadyExistsError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if password does not meet password requiriments', async () => {
    const input = {
      email: 'test@example.com',
      password: 'weakPassword',
      name: 'Teste',
    };

    const result = await useCase.run(input, actor);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if email is invalid', async () => {
    const input = {
      email: 'invalid',
      password: 'Password123!',
      name: 'Teste',
    };

    const result = await useCase.run(input, actor);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if name is invalid', async () => {
    const input = {
      email: 'invalid',
      password: 'Password123!',
      name: '',
    };

    const result = await useCase.run(input, actor);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('should create a new user with hashed password', async () => {
    const input = {
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'Novo Usuário',
    };

    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(genUser());

    jest.spyOn(PasswordUtil, 'hashPassword').mockResolvedValue('hashedPassword');

    const result = await useCase.run(input, actor);

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

  it('should run the write inside the unit of work with the given actor', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.create.mockResolvedValue(genUser());

    await useCase.run({ email: 'a@example.com', password: 'Password123!', name: 'A' }, actor);

    expect(uow.actors).toEqual([actor]);
  });

  it('should not open the unit of work when the input is invalid', async () => {
    await useCase.run({ email: 'invalid', password: 'Password123!', name: 'A' }, actor);

    expect(uow.actors).toEqual([]);
  });

  it('should return UnknownError when the unit of work throws', async () => {
    userRepo.findByEmail.mockRejectedValue(new Error('db down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await useCase.run(
      { email: 'a@example.com', password: 'Password123!', name: 'A' },
      actor,
    );

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(UnknownError);
  });
});
