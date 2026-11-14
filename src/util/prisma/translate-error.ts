import { ConflitError, NotFoundError, ServiceUnavailableError } from '@src/errors/generic.errors';
import { Prisma } from '@src/generated/prisma/client';

export type TranslatedPrismaError = ConflitError | NotFoundError | ServiceUnavailableError;

/**
 * Traduz um erro conhecido do Prisma em erro de negócio (AD-17).
 * Devolve `undefined` para qualquer outra coisa: o chamador trata como erro inesperado.
 *
 * - P2002 (unicidade) e P2003 (chave estrangeira) -> 409
 * - P2025 (registro inexistente)                  -> 404
 * - P2028 (timeout da transação) e P2034 (conflito de escrita) -> 503
 *
 * A mensagem é fixa de propósito: `error.message` e `error.meta` do Prisma trazem
 * nomes de tabela, colunas e valores, que não devem chegar ao cliente.
 */
export function translatePrismaError(error: unknown): TranslatedPrismaError | undefined {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return undefined;

  switch (error.code) {
    case 'P2002':
      return new ConflitError('Já existe um registro com estes dados.');
    case 'P2003':
      return new ConflitError('A operação viola um vínculo com outro registro.');
    case 'P2025':
      return new NotFoundError();
    case 'P2028':
    case 'P2034':
      return new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes.',
      );
    default:
      return undefined;
  }
}
