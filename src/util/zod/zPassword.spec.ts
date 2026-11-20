import PasswordUtil from '@src/util/password';
import { zPassword } from './zPassword';

const messageOf = (input: unknown) => {
  const result = zPassword().safeParse(input);
  return result.success ? undefined : result.error.issues[0].message;
};

describe('zPassword', () => {
  describe('accepts any symbol (D-20)', () => {
    // inclui '-' (antes rejeitado) e ',' (antes aceito por engano, por causa do join())
    const symbols = ['!', '@', '#', '$', '%', '&', '*', '+', '=', '~', '^', '-', '_', ',', '.', ';', ':', '?', '/', '(', ')', '[', ']', '{', '}', '<', '>', '|', '\\', "'", '"', '`', ' '];

    it.each(symbols.map(s => [s]))('accepts the symbol %j', symbol => {
      expect(zPassword().safeParse(`Senha1${symbol}xyz`).success).toBe(true);
    });
  });

  it('accepts a valid password', () => {
    expect(zPassword().safeParse('Senha-Forte#1').success).toBe(true);
  });

  it('accepts a password with accented letters when it has a real symbol', () => {
    expect(zPassword().safeParse('Açaí123!').success).toBe(true);
  });

  it('does not count an accent as a symbol', () => {
    expect(messageOf('Açaí1234')).toBe('A senha deve possuir ao menos um símbolo');
  });

  describe('rejects with a clear message', () => {
    it.each([
      ['too short', 'Ab1!', 'A senha deve ter no mínimo 8 caracteres'],
      ['seven characters', 'Abcde1!', 'A senha deve ter no mínimo 8 caracteres'],
      ['empty', '', 'A senha deve ter no mínimo 8 caracteres'],
      ['no letter', '1234567!', 'A senha deve possuir ao menos uma letra'],
      ['no uppercase letter', 'senha-1234', 'A senha deve possuir ao menos uma letra maiúscula'],
      ['no number', 'Senha-forte', 'A senha deve possuir ao menos um número'],
      ['no symbol', 'Senha12345', 'A senha deve possuir ao menos um símbolo'],
    ])('%s', (_label, input, message) => {
      expect(messageOf(input)).toBe(message);
    });
  });

  it('accepts exactly 8 characters', () => {
    expect(zPassword().safeParse('Abcdef1!').success).toBe(true);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['number', 12345678],
  ])('rejects a non-string value (%s)', (_label, input) => {
    expect(zPassword().safeParse(input).success).toBe(false);
  });
});

describe('PasswordUtil.checkPasswordRules', () => {
  it.each([['-'], [','], ['_'], ['.']])('returns undefined when the only symbol is %j', symbol => {
    expect(PasswordUtil.checkPasswordRules(`Senha1${symbol}xyz`)).toBeUndefined();
  });

  it('does not list symbols in the message, since any symbol is valid', () => {
    expect(PasswordUtil.checkPasswordRules('Senha12345')).not.toMatch(/Ex\.:/);
  });
});
