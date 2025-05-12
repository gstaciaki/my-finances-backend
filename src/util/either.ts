export type Either<L, A> = Wrong<L, A> | Right<L, A>;

export class Wrong<L, A> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isWrong(): this is Wrong<L, A> {
    return true;
  }

  isRight(): this is Right<L, A> {
    return false;
  }
}

export class Right<L, A> {
  readonly value: A;

  constructor(value: A) {
    this.value = value;
  }

  isWrong(): this is Wrong<L, A> {
    return false;
  }

  isRight(): this is Right<L, A> {
    return true;
  }
}

export const wrong = <L, A>(l: L): Either<L, A> => {
  return new Wrong(l);
};

export const right = <L, A>(a: A): Either<L, A> => {
  return new Right<L, A>(a);
};
