import { Actor } from '@src/database/context';
import { IUnitOfWork, Repositories } from '@src/database/unit-of-work';
import { Either } from '@src/util/either';
import { UseCasePipeline, UseCaseResult } from './use-case';

export abstract class AbstractWriteUseCase<
  Input,
  FailOutput extends Error,
  SuccessOutput,
> extends UseCasePipeline<Input, FailOutput, SuccessOutput> {
  constructor(protected readonly uow: IUnitOfWork) {
    super();
  }

  protected abstract execute(
    input: Input,
    repos: Repositories,
  ): Promise<Either<FailOutput, SuccessOutput>>;

  public run(input: Input, actor: Actor): Promise<UseCaseResult<FailOutput, SuccessOutput>> {
    return this.runPipeline(input, async parsedInput => {
      return this.uow.run(actor, repos => this.execute(parsedInput, repos));
    });
  }
}
