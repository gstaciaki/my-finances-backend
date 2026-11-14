import { ChangeUserPasswordUseCase } from './change-user-password.usecase';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { genUser } from 'test/prefab/user';
import { genActor } from 'test/prefab/actor';
import { FakeUnitOfWork } from 'test/helpers/fake-unit-of-work';
import { UnknownError } from '@src/errors/unknow.error';
import { EmailOrPasswordWrongError } from '@src/errors/login.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import PasswordUtil from '@src/util/password';

describe('ChangeUserPasswordUseCase', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let uow: FakeUnitOfWork;
  let useCase: ChangeUserPasswordUseCase;
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
    useCase = new ChangeUserPasswordUseCase(uow);
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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    const result = await useCase.run(input, actor);

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

    await useCase.run(input, actor);

    expect(hashPasswordSpy).toHaveBeenCalledWith(input.newPassword);
    expect(hashPasswordSpy).toHaveBeenCalledTimes(1);
  });

  it('should run inside the unit of work with the given actor', async () => {
    userRepo.findById.mockResolvedValue(null);
    userRepo.findByEmail.mockResolvedValue(null);

    await useCase.run(
      { email: 'user@example.com', currentPassword: 'OldPass123!', newPassword: 'NewPass123!' },
      actor,
    );

    expect(uow.actors).toEqual([actor]);
  });

  it('should not open the unit of work when the input is invalid', async () => {
    await useCase.run(
      { email: 'invalid-email', currentPassword: 'OldPass123!', newPassword: 'NewPass123!' },
      actor,
    );

    expect(uow.actors).toEqual([]);
  });

  it('should return UnknownError when the repository throws inside the unit of work', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    userRepo.findById.mockRejectedValue(new Error('db down'));
    userRepo.findByEmail.mockRejectedValue(new Error('db down'));

    const result = await useCase.run(
      { email: 'user@example.com', currentPassword: 'OldPass123!', newPassword: 'NewPass123!' },
      actor,
    );

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(UnknownError);
  });
});
