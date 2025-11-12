import { AbstractUseCase } from '@src/core/use-case';
import { DefaultFailOutput } from '@src/types/errors';
import {
  ChangeUserPasswordInput,
  ChangeUserPasswordOutput,
  ChangeUserPasswordSchema,
} from '../dtos';
import { IUserRepository } from '@src/repositories/user/user.repository';
import { ZodType } from 'zod';
import { Either, right, wrong } from '@src/util/either';
import PasswordUtil from '@src/util/password';
import { User } from '@src/entities/user.entity';
import { EmailOrPasswordWrongError } from '@src/errors/login.errors';

type Input = ChangeUserPasswordInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = ChangeUserPasswordOutput;

export class ChangeUserPasswordUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validationRules(): ZodType<Input> {
    return ChangeUserPasswordSchema;
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await this.userRepo.findByEmail(input.email);

    if (!user) {
      return wrong(new EmailOrPasswordWrongError());
    }

    const matchPassword = await PasswordUtil.comparePasswords(input.currentPassword, user.password);

    if (!matchPassword) {
      return wrong(new EmailOrPasswordWrongError());
    }

    const hashedPassword = await PasswordUtil.hashPassword(input.newPassword);

    const domainUser = new User({ ...user, password: hashedPassword });

    await this.userRepo.update(domainUser.id, domainUser);

    return right({ message: 'Senha atualizada com sucesso' });
  }
}
