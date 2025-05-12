import { User } from '@src/entities/user.entity';
import { AlreadyExistsError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { IUserRepository } from '@src/repositories/user.repository';
import { DefaultFailOutput } from '@src/types/errors';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { CreateUserInput, CreateUserOutput } from './dtos';

type Input = CreateUserInput;

type FailOutput = DefaultFailOutput;
type SuccessOutput = CreateUserOutput;

export class CreateUserUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validate(input: Input): Either<InputValidationError, void> {
    const { name, email, password, cpf } = input ?? {};

    if (!name || !email || !password || !cpf) {
      return wrong(new InputValidationError('Todos os campos são obrigatórios.'));
    }

    if (!email.includes('@')) {
      return wrong(new InputValidationError('Email inválido.'));
    }

    return right(undefined);
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      return wrong(new AlreadyExistsError('usuário', 'email'));
    }

    const user = new User(input);
    await this.userRepo.create(user);
    return right(user);
  }
}
