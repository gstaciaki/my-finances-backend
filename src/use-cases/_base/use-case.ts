import { InputValidationError } from '@src/errors/input-validation.error';
import { UnknownError } from '@src/errors/unknow.error';
import { Either, wrong } from '@src/util/either';
import { ZodSchema } from 'zod';

export abstract class AbstractUseCase<Input, FailOutput extends Error, SuccessOutput> {
  constructor() {}

  protected abstract execute(
    input?: Input,
  ): Promise<Either<FailOutput | InputValidationError | UnknownError, SuccessOutput>>;

  protected abstract validationRules(): ZodSchema<Input>;

  public async run(
    input: Input,
  ): Promise<Either<FailOutput | InputValidationError | UnknownError, SuccessOutput>> {
    try {
      const schema = this.validationRules();
      const result = schema.safeParse(input);

      if (!result.success) {
        return wrong(new InputValidationError(result.error));
      }

      const parsedInput = result.data;
      const output = await this.execute(parsedInput);
      return output;
    } catch (error) {
      return wrong(new UnknownError(error));
    }
  }
}
