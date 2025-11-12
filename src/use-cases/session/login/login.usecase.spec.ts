import { IUserRepository } from '@src/repositories/user/user.repository';
import { LoginUseCase } from './login.usecase';
import { genUser } from 'test/prefab/user';
import { InputValidationError } from '@src/errors/input-validation.error';
import { EmailOrPasswordWrongError } from '@src/errors/login.errors';
import PasswordUtil from '@src/util/password';
import JWT from '@src/util/jwt';

describe('LoginUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: LoginUseCase;

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

    useCase = new LoginUseCase(userRepo);
  });

  it('should return tokens if login is successful', async () => {
    const input = {
      email: 'user@example.com',
      password: 'Password123!',
    };

    const mockUser = genUser({
      id: 'user-123',
      email: input.email,
      password: 'hashedPassword',
    });

    userRepo.findByEmail.mockResolvedValue(mockUser);
    jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(true);
    jest
      .spyOn(JWT, 'signToken')
      .mockReturnValueOnce('access.token')
      .mockReturnValueOnce('refresh.token');

    const result = await useCase.run(input);

    expect(result.isRight()).toBe(true);
    if (result.isWrong()) fail('Expected result to be Right');
    expect(result.value).toEqual({
      accessToken: 'access.token',
      refreshToken: 'refresh.token',
    });
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
    expect(PasswordUtil.comparePasswords).toHaveBeenCalledWith(input.password, mockUser.password);
    expect(JWT.signToken).toHaveBeenCalledWith({ userId: mockUser.id });
    expect(JWT.signToken).toHaveBeenCalledWith({ userId: mockUser.id, refresh: true });
  });

  it('should return EmailOrPasswordWrongError if user does not exist', async () => {
    const input = {
      email: 'nonexistent@example.com',
      password: 'Password123!',
    };

    userRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(EmailOrPasswordWrongError);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
  });

  it('should return EmailOrPasswordWrongError if password is incorrect', async () => {
    const input = {
      email: 'user@example.com',
      password: 'WrongPassword123!',
    };

    const mockUser = genUser({
      email: input.email,
      password: 'hashedPassword',
    });

    userRepo.findByEmail.mockResolvedValue(mockUser);
    jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(false);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(EmailOrPasswordWrongError);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
    expect(PasswordUtil.comparePasswords).toHaveBeenCalledWith(input.password, mockUser.password);
  });

  it('should return InputValidationError if email is invalid', async () => {
    const input = {
      email: 'invalid-email',
      password: 'Password123!',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if password does not meet requirements', async () => {
    const input = {
      email: 'user@example.com',
      password: 'weak',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if email is missing', async () => {
    const input = {
      email: '',
      password: 'Password123!',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if password is missing', async () => {
    const input = {
      email: 'user@example.com',
      password: '',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });
});
