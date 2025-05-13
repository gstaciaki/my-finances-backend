import { User } from '@src/entities/user.entity';
import { BaseBusinessError } from '@src/errors/base-business.error';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { UnknownError } from '@src/errors/unknow.error';
import { IUserRepository } from '@src/repositories/user.repository';
import { AbstractUseCase } from '@src/use-cases/_base/use-case';
import { Either, right, wrong } from '@src/util/either';
import { ShowUserInput, ShowUserOutput } from './dtos';

type Input = ShowUserInput;
type FailOutput = BaseBusinessError | UnknownError;
type SuccessOutput = ShowUserOutput;

export class ShowUserUseCase extends AbstractUseCase<Input, FailOutput, SuccessOutput> {
  constructor(private readonly userRepo: IUserRepository) {
    super();
  }

  protected validate(input: Input): Either<InputValidationError, void> {
    if (!input.id) return wrong(new InputValidationError('ID é obrigatório'));

    return right(undefined);
  }

  protected async execute(input: Input): Promise<Either<FailOutput, SuccessOutput>> {
    const user = await this.userRepo.findById(input.id);

    if (!user) {
      return wrong(new NotFoundError('usuário', 'id', input.id));
    }

    const domainUser = new User(user);
    return right(domainUser);
  }
}
