import { Either } from '@src/util/either';

export function expectWrong<L, R>(result: Either<L, R>): L {
  if (result.isWrong()) {
    return result.value;
  }

  throw new Error(`[Expected Wrong] Received Right: ${JSON.stringify(result.value)}`);
}
