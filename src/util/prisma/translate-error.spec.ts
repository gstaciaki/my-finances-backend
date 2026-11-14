import { ConflitError, NotFoundError, ServiceUnavailableError } from '@src/errors/generic.errors';
import { Prisma } from '@src/generated/prisma/client';
import { translatePrismaError } from './translate-error';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('mensagem interna com "User_email_key"', {
    code,
    clientVersion: 'test',
    meta: { target: ['email'] },
  });

describe('translatePrismaError', () => {
  it.each([
    ['P2002', ConflitError],
    ['P2003', ConflitError],
    ['P2025', NotFoundError],
    ['P2028', ServiceUnavailableError],
    ['P2034', ServiceUnavailableError],
  ])('translates %s into %p', (code, expected) => {
    expect(translatePrismaError(prismaError(code))).toBeInstanceOf(expected);
  });

  it('returns undefined for a Prisma code that is not mapped', () => {
    expect(translatePrismaError(prismaError('P2000'))).toBeUndefined();
  });

  it.each([
    ['a generic Error', new Error('boom')],
    ['a string', 'P2002'],
    ['an object with a code', { code: 'P2002' }],
    ['null', null],
    ['undefined', undefined],
  ])('returns undefined for %s', (_, value) => {
    expect(translatePrismaError(value)).toBeUndefined();
  });

  it('does not leak the Prisma message or meta to the client', () => {
    const translated = translatePrismaError(prismaError('P2002'))!;

    expect(translated.message).not.toContain('User_email_key');
    expect(translated.message).not.toContain('email');
  });
});
