import { ConflitError, NotFoundError, ServiceUnavailableError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { UnknownError } from '@src/errors/unknow.error';
import { Prisma } from '@src/generated/prisma/client';
import { Either, right } from '@src/util/either';
import { FakeUnitOfWork } from 'test/helpers/fake-unit-of-work';
import { genActor } from 'test/prefab/actor';
import { z, ZodType } from 'zod';
import { AbstractUseCase } from './use-case';
import { AbstractWriteUseCase } from './write-use-case';

type Input = { name: string };

const schema = z.object({ name: z.string().min(1) });

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('interno', { code, clientVersion: 'test' });

class ReadUseCase extends AbstractUseCase<Input, Error, string> {
  constructor(private readonly behavior: () => Promise<Either<Error, string>>) {
    super();
  }
  protected validationRules(): ZodType<Input> {
    return schema;
  }
  protected execute() {
    return this.behavior();
  }
}

class WriteUseCase extends AbstractWriteUseCase<Input, Error, string> {
  constructor(
    uow: FakeUnitOfWork,
    private readonly behavior: () => Promise<Either<Error, string>>,
  ) {
    super(uow);
  }
  protected validationRules(): ZodType<Input> {
    return schema;
  }
  protected execute() {
    return this.behavior();
  }
}

const fail = (error: unknown) => () => Promise.reject(error);

describe('use case pipeline', () => {
  const uow = new FakeUnitOfWork({ user: {} as never });
  const actor = genActor();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe.each([
    ['read', (behavior: () => Promise<Either<Error, string>>) => new ReadUseCase(behavior), false],
    [
      'write',
      (behavior: () => Promise<Either<Error, string>>) => new WriteUseCase(uow, behavior),
      true,
    ],
  ])('%s use case', (_, make, isWrite) => {
    const run = (useCase: ReadUseCase | WriteUseCase, input: Input = { name: 'a' }) =>
      isWrite ? (useCase as WriteUseCase).run(input, actor) : (useCase as ReadUseCase).run(input);

    it('returns the Right of execute untouched', async () => {
      const result = await run(make(async () => right('ok')));

      expect(result.isRight()).toBe(true);
      expect(result.value).toBe('ok');
    });

    it('returns InputValidationError without calling execute', async () => {
      const behavior = jest.fn();

      const result = await run(make(behavior), { name: '' });

      expect(result.value).toBeInstanceOf(InputValidationError);
      expect(behavior).not.toHaveBeenCalled();
    });

    it.each([
      ['P2002', ConflitError],
      ['P2003', ConflitError],
      ['P2025', NotFoundError],
      ['P2028', ServiceUnavailableError],
      ['P2034', ServiceUnavailableError],
    ])('translates Prisma %s into %p', async (code, expected) => {
      const result = await run(make(fail(prismaError(code))));

      expect(result.isWrong()).toBe(true);
      expect(result.value).toBeInstanceOf(expected);
    });

    it('keeps UnknownError for an unmapped Prisma code', async () => {
      const result = await run(make(fail(prismaError('P2000'))));

      expect(result.value).toBeInstanceOf(UnknownError);
    });

    it('keeps UnknownError for a generic exception', async () => {
      const result = await run(make(fail(new Error('boom'))));

      expect(result.value).toBeInstanceOf(UnknownError);
    });

    it('does not log client errors (409/404) but logs the unexpected ones', async () => {
      await run(make(fail(prismaError('P2002'))));
      await run(make(fail(prismaError('P2025'))));
      expect(console.error).not.toHaveBeenCalled();

      await run(make(fail(new Error('boom'))));
      await run(make(fail(prismaError('P2028'))));
      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });
});
