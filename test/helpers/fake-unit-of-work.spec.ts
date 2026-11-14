import { IUserRepository } from '@src/repositories/user/user.repository';
import { right, wrong } from '@src/util/either';
import { genActor } from 'test/prefab/actor';
import { FakeUnitOfWork } from './fake-unit-of-work';

describe('FakeUnitOfWork', () => {
  const repositories = { user: {} as jest.Mocked<IUserRepository> };

  it('passes the given repositories to the callback and returns its Right', async () => {
    const uow = new FakeUnitOfWork(repositories);

    const result = await uow.run(genActor(), async repos => right<Error, unknown>(repos.user));

    expect(result.isRight()).toBe(true);
    expect(result.value).toBe(repositories.user);
  });

  it('returns the same Wrong without throwing', async () => {
    const uow = new FakeUnitOfWork(repositories);
    const failure = wrong<Error, never>(new Error('regra'));

    await expect(uow.run(genActor(), async () => failure)).resolves.toBe(failure);
  });

  it('rethrows exceptions from the callback', async () => {
    const uow = new FakeUnitOfWork(repositories);

    await expect(
      uow.run(genActor(), async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('records the actors it was run with', async () => {
    const uow = new FakeUnitOfWork(repositories);
    const [a, b] = [genActor(), genActor()];

    await uow.run(a, async () => right<Error, null>(null));
    await uow.run(b, async () => right<Error, null>(null));

    expect(uow.actors).toEqual([a, b]);
  });
});
