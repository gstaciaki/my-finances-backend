import { zEmail } from './zEmail';

describe('zEmail', () => {
  it.each([
    ['ana@example.com', 'ana@example.com'],
    ['ANA@EXAMPLE.COM', 'ana@example.com'],
    ['Ana.Silva@Example.com', 'ana.silva@example.com'],
    ['  ana@example.com  ', 'ana@example.com'],
    ['\t Ana@Example.COM \n', 'ana@example.com'],
    ['ana+financas@example.com', 'ana+financas@example.com'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(zEmail.parse(input)).toBe(expected);
  });

  it('gives the same value for the same e-mail in any case', () => {
    expect(zEmail.parse('Ana@X.com')).toBe(zEmail.parse('ana@x.COM'));
  });

  it('is idempotent', () => {
    const once = zEmail.parse('  ANA@Example.com ');
    expect(zEmail.parse(once)).toBe(once);
  });

  it.each([
    ['empty string', ''],
    ['only spaces', '   '],
    ['no at sign', 'ana.example.com'],
    ['no domain', 'ana@'],
    ['no local part', '@example.com'],
    ['spaces inside', 'ana silva@example.com'],
    ['two at signs', 'ana@@example.com'],
  ])('rejects %s', (_label, input) => {
    expect(zEmail.safeParse(input).success).toBe(false);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['number', 123],
    ['object', {}],
  ])('rejects a non-string value (%s)', (_label, input) => {
    expect(zEmail.safeParse(input).success).toBe(false);
  });
});
