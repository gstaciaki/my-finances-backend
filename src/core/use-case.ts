import { InputValidationError } from '@src/errors/input-validation.error';
import { ServiceUnavailableError } from '@src/errors/generic.errors';
import { UnknownError } from '@src/errors/unknow.error';
import { Either, wrong } from '@src/util/either';
import { translatePrismaError, TranslatedPrismaError } from '@src/util/prisma/translate-error';
import { ZodType } from 'zod';

export type UseCaseResult<FailOutput extends Error, SuccessOutput> = Either<
  FailOutput | InputValidationError | UnknownError | TranslatedPrismaError,
  SuccessOutput
>;

export abstract class UseCasePipeline<Input, FailOutput extends Error, SuccessOutput> {
  protected abstract validationRules(): ZodType<Input>;

  protected async runPipeline(
    input: Input,
    handler: (parsedInput: Input) => Promise<UseCaseResult<FailOutput, SuccessOutput>>,
  ): Promise<UseCaseResult<FailOutput, SuccessOutput>> {
    try {
      const result = this.validationRules().safeParse(input);

      if (!result.success) {
        return wrong(new InputValidationError(result.error));
      }

      return await handler(result.data);
    } catch (error) {
      const translated = translatePrismaError(error);
      if (translated) {
        if (translated instanceof ServiceUnavailableError) console.error(error);
        return wrong(translated);
      }

      console.error(error);
      return wrong(new UnknownError());
    }
  }
}

export abstract class AbstractUseCase<
  Input,
  FailOutput extends Error,
  SuccessOutput,
> extends UseCasePipeline<Input, FailOutput, SuccessOutput> {
  protected abstract execute(input?: Input): Promise<UseCaseResult<FailOutput, SuccessOutput>>;

  public run(input: Input): Promise<UseCaseResult<FailOutput, SuccessOutput>> {
    return this.runPipeline(input, parsedInput => this.execute(parsedInput));
  }
}
