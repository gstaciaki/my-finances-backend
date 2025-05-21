import { Faker, pt_BR } from '@faker-js/faker';

const f = new Faker({
  locale: [pt_BR],
});

const digit = () => f.number.int({ min: 0, max: 9 });

function mod(dividend: number, divider: number) {
  return Math.round(dividend - Math.floor(dividend / divider) * divider);
}

function hashDigit<T>(n: number, overflow: T, max: number = 11): number | T {
  const d = max - mod(n, max);
  return d >= max - 1 ? (overflow ?? 0) : d;
}

export function cpf(masked: boolean = true) {
  const n = Array.from({ length: 9 }, digit);

  let d1 = n.reduce((acc, ni, i) => acc + ni * (10 - i), 0);
  d1 = hashDigit(d1, 0);

  let d2 = n.reduce((acc, ni, i) => acc + ni * (11 - i), d1 * 2);
  d2 = hashDigit(d2, 0);

  if (!masked) return [...n, d1, d2].join('');

  const [n1, n2, n3, n4, n5, n6, n7, n8, n9] = n;
  return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
}
