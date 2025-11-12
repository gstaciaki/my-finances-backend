import { ChangeUserPasswordUseCase } from './change-user-password.usecase';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { genUser } from 'test/prefab/user';
import { EmailOrPasswordWrongError } from '@src/errors/login.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import PasswordUtil from '@src/util/password';

describe('ChangeUserPasswordUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let useCase: ChangeUserPasswordUseCase;

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

    useCase = new ChangeUserPasswordUseCase(userRepo);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return InputValidationError if email is invalid', async () => {
    const input = {
      email: 'invalid-email',
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return EmailOrPasswordWrongError if currentPassword is empty', async () => {
    const existingUser = genUser({ email: 'user@example.com', password: 'hashedPassword' });
    const input = {
      email: 'user@example.com',
      currentPassword: '',
      newPassword: 'NewPass123!',
    };

    userRepo.findByEmail.mockResolvedValue(existingUser);
    jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(false);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(EmailOrPasswordWrongError);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
  });

  it('should return InputValidationError if newPassword does not meet requirements (missing uppercase)', async () => {
    const input = {
      email: 'user@example.com',
      currentPassword: 'OldPass123!',
      newPassword: 'newpass123!',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if newPassword does not meet requirements (missing number)', async () => {
    const input = {
      email: 'user@example.com',
      currentPassword: 'OldPass123!',
      newPassword: 'NewPassword!',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if newPassword does not meet requirements (missing special character)', async () => {
    const input = {
      email: 'user@example.com',
      currentPassword: 'OldPass123!',
      newPassword: 'NewPassword123',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return InputValidationError if newPassword does not meet requirements (too short)', async () => {
    const input = {
      email: 'user@example.com',
      currentPassword: 'OldPass123!',
      newPassword: 'Pass1!',
    };

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InputValidationError);
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('should return EmailOrPasswordWrongError if user does not exist', async () => {
    const input = {
      email: 'nonexistent@example.com',
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    };

    userRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(EmailOrPasswordWrongError);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should return EmailOrPasswordWrongError if current password is incorrect', async () => {
    const existingUser = genUser({ email: 'user@example.com', password: 'hashedOldPassword' });
    const input = {
      email: 'user@example.com',
      currentPassword: 'WrongPass123!',
      newPassword: 'NewPass123!',
    };

    userRepo.findByEmail.mockResolvedValue(existingUser);
    jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(false);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(EmailOrPasswordWrongError);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
    expect(PasswordUtil.comparePasswords).toHaveBeenCalledWith(
      input.currentPassword,
      existingUser.password,
    );
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('should update user password and return success message', async () => {
    const existingUser = genUser({ email: 'user@example.com', password: 'hashedOldPassword' });
    const input = {
      email: 'user@example.com',
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    };

    userRepo.findByEmail.mockResolvedValue(existingUser);
    jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(true);
    jest.spyOn(PasswordUtil, 'hashPassword').mockResolvedValue('hashedNewPassword');
    userRepo.update.mockResolvedValue({ ...existingUser, password: 'hashedNewPassword' });

    const result = await useCase.run(input);

    if (result.isWrong()) fail('Expected result to be Right');

    expect(result.value).toEqual({ message: 'Senha atualizada com sucesso' });
    expect(userRepo.findByEmail).toHaveBeenCalledWith(input.email);
    expect(PasswordUtil.comparePasswords).toHaveBeenCalledWith(
      input.currentPassword,
      existingUser.password,
    );
    expect(PasswordUtil.hashPassword).toHaveBeenCalledWith(input.newPassword);
    expect(userRepo.update).toHaveBeenCalledWith(
      existingUser.id,
      expect.objectContaining({
        id: existingUser.id,
        email: existingUser.email,
        password: 'hashedNewPassword',
      }),
    );
  });

  it('should hash the new password before saving', async () => {
    const existingUser = genUser({ email: 'user@example.com', password: 'hashedOldPassword' });
    const input = {
      email: 'user@example.com',
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    };

    userRepo.findByEmail.mockResolvedValue(existingUser);
    jest.spyOn(PasswordUtil, 'comparePasswords').mockResolvedValue(true);
    const hashPasswordSpy = jest
      .spyOn(PasswordUtil, 'hashPassword')
      .mockResolvedValue('hashedNewPassword');
    userRepo.update.mockResolvedValue({ ...existingUser, password: 'hashedNewPassword' });

    await useCase.run(input);

    expect(hashPasswordSpy).toHaveBeenCalledWith(input.newPassword);
    expect(hashPasswordSpy).toHaveBeenCalledTimes(1);
  });
});
