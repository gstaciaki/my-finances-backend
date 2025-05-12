import { User } from "@src/entities/user.entity";
import { BaseBusinessError } from "@src/errors/base-business.error";
import { InputValidationError } from "@src/errors/input-validation.error";
import { UnknownError } from "@src/errors/unknow.error";
import { IUserRepository } from "@src/repositories/user.repository";
import { AbstractUseCase } from "@src/use-cases/_base/use-case";
import { Either, right } from "@src/util/either";

type Input = void;
type FailOutput = BaseBusinessError | UnknownError;
type SuccessOutput = User[];

export class ListUsersUseCase extends AbstractUseCase<
  Input,
  FailOutput,
  SuccessOutput
> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validate(input: Input): Either<InputValidationError, void> {
    return right(undefined);
  }

  protected async execute(
    input: Input
  ): Promise<Either<FailOutput, SuccessOutput>> {
    const users = await this.userRepo.findAll();
    const domainUsers = users.map((user) => new User(user));

    return right(domainUsers);
  }
}
