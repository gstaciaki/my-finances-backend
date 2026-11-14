import { AbstractWriteUseCase } from '@src/core/write-use-case';
import { DefaultFailOutput } from '@src/types/errors';
import {
  ChangeUserPasswordInput,
  ChangeUserPasswordOutput,
  ChangeUserPasswordSchema,
} from '../dtos';
import { ZodType } from 'zod';
import { Either, right, wrong } from '@src/util/either';
import PasswordUtil from '@src/util/password';
import { User } from '@src/entities/user.entity';
import { EmailOrPasswordWrongError } from '@src/errors/login.errors';
import { Repositories } from '@src/database/unit-of-work';

type Input = ChangeUserPasswordInput;
type FailOutput = DefaultFailOutput;
type SuccessOutput = ChangeUserPasswordOutput;

export class ChangeUserPasswordUseCase extends AbstractWriteUseCase<
  Input,
  FailOutput,
  SuccessOutput
> {
  protected validationRules(): ZodType<Input> {
    return ChangeUserPasswordSchema;
  }

  protected async execute(
    input: Input,
    { user: userRepo }: Repositories,
  ): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await userRepo.findByEmail(input.email);

    if (!user) {
      return wrong(new EmailOrPasswordWrongError());
    }

    const matchPassword = await PasswordUtil.comparePasswords(input.currentPassword, user.password);

    if (!matchPassword) {
      return wrong(new EmailOrPasswordWrongError());
    }

    const hashedPassword = await PasswordUtil.hashPassword(input.newPassword);

    const domainUser = new User({ ...user, password: hashedPassword });

    await userRepo.update(domainUser.id, domainUser);

    return right({ message: 'Senha atualizada com sucesso' });
  }
}
