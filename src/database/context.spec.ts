import { genActor } from 'test/prefab/actor';
import { als, getActor, getContext, getTx, SYSTEM } from './context';

describe('request context', () => {
  it('is empty outside of a transaction', () => {
    expect(getContext()).toEqual({});
    expect(getActor()).toBeUndefined();
    expect(getTx()).toBeUndefined();
  });

  it('exposes the system actor', () => {
    expect(SYSTEM).toEqual({ userId: 'system' });
  });

  it('exposes actor and tx inside als.run, across awaits', async () => {
    const actor = genActor();
    const tx = {} as never;

    await als.run({ actor, tx }, async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(getActor()).toBe(actor);
      expect(getTx()).toBe(tx);
    });

    expect(getActor()).toBeUndefined();
  });

  it('keeps concurrent contexts isolated', async () => {
    const [a, b] = [genActor(), genActor()];
    const seen: string[] = [];

    await Promise.all([
      als.run({ actor: a }, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        seen.push(getActor()!.userId);
      }),
      als.run({ actor: b }, async () => {
        seen.push(getActor()!.userId);
      }),
    ]);

    expect(seen).toEqual([b.userId, a.userId]);
  });
});
