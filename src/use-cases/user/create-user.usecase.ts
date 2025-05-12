import { User } from "@src/entities/user.entity";
import { BaseBusinessError } from "@src/errors/base-business.error";
import { AlreadyExistsError } from "@src/errors/generic.errors";
import { InputValidationError } from "@src/errors/input-validation.error";
import { UnknownError } from "@src/errors/unknow.error";
import { IUserRepository } from "@src/repositories/user.repository";
import { AbstractUseCase } from "@src/use-cases/_base/use-case";
import { Either, right, wrong } from "@src/util/either";

type Input = {
  name: string;
  email: string;
  password: string;
  cpf: string;
};

type FailOutput = BaseBusinessError | UnknownError;
type SuccessOutput = User;

export class CreateUserUseCase extends AbstractUseCase<
  Input,
  FailOutput,
  SuccessOutput
> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validate(input: Input): Either<InputValidationError, void> {
    const { name, email, password, cpf } = input ?? {};

    if (!name || !email || !password || !cpf) {
      return wrong(
        new InputValidationError("Todos os campos são obrigatórios.")
      );
    }

    if (!email.includes("@")) {
      return wrong(new InputValidationError("Email inválido."));
    }

    return right(undefined);
  }

  protected async execute(
    input: Input
  ): Promise<Either<FailOutput, SuccessOutput>> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      return wrong(new AlreadyExistsError("usuário", "email"));
    }

    const user = new User(input);
    await this.userRepo.create(user);
    return right(user);
  }
}
