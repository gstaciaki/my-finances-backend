import { InputValidationError } from '@src/errors/input-validation.error';
import { UnknownError } from '@src/errors/unknow.error';
import { Either, wrong } from '@src/util/either';

export abstract class AbstractUseCase<Input, FailOutput extends Error, SuccessOutput> {
  constructor() {}

  protected abstract execute(
    input?: Input,
  ): Promise<Either<FailOutput | InputValidationError | UnknownError, SuccessOutput>>;

  protected abstract validate(input: Input): Either<InputValidationError, void>;

  public async run(
    input: Input,
  ): Promise<Either<FailOutput | InputValidationError | UnknownError, SuccessOutput>> {
    try {
      const validation = this.validate(input);
      if (validation.isWrong()) {
        return wrong(validation.value);
      }
      const result = await this.execute(input);
      return result;
    } catch (error) {
      return wrong(new UnknownError(error));
    }
  }
}
