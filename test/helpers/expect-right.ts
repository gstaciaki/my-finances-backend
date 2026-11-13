import { Either } from '@src/util/either';

export function expectRight<L, R>(result: Either<L, R>): R {
  if (result.isRight()) {
    return result.value;
  }

  const error = result.value;
  const message =
    error !== null
      ? typeof error === 'object' && 'message' in error
        ? error.message
        : JSON.stringify(error)
      : 'Unexpected error';

  throw new Error(`[Expected Right] Received Left: ${message}`);
}
