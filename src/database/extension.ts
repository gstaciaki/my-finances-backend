import { ForbiddenOperationError } from '@src/errors/forbidden-operation.error';
import { prismaRaw } from './raw';
import { getContext } from './context';
import { Prisma } from '@src/generated/prisma/client';

const BLOCKED = [
  'createMany',
  'createManyAndReturn',
  'updateMany',
  'updateManyAndReturn',
  'deleteMany',
];
const AUDITED = ['create', 'update', 'upsert', 'delete'];
const NESTED_KEYS = [
  'create',
  'createMany',
  'connect',
  'connectOrCreate',
  'update',
  'upsert',
  'delete',
  'disconnect',
  'set',
];
const WRITE_SQL = /\b(insert|update|delete|truncate|drop|alter|create)\b/i;

type Row = Record<string, unknown>;
type Delegate = { findUnique(args: { where: unknown }): Promise<Row | null> };

const mask = (row: Row | null) => {
  if (!row) return Prisma.JsonNull;
  const masked = Object.entries(row).map(([key, value]) => [
    key,
    key === 'password' || key.endsWith('Hash') ? '***' : value,
  ]);
  return Object.fromEntries(masked) as Prisma.InputJsonObject;
};

const hasNestedWrite = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  return Object.values(data).some(
    value =>
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !Array.isArray(value) &&
      Object.keys(value).some(key => NESTED_KEYS.includes(key)),
  );
};

const sqlText = (args: unknown): string => {
  if (typeof args === 'string') return args;
  if (Array.isArray(args)) return sqlText(args[0]);
  const sql = args as { string?: string[]; sql?: string; text?: string };
  return sql?.string?.join(' ') ?? sql?.sql ?? sql.text ?? '';
};

const assertReadOnly = (args: unknown, operation: string) => {
  if (WRITE_SQL.test(sqlText(args))) throw new ForbiddenOperationError(`writing ${operation}`);
};

export const prisma = prismaRaw.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (BLOCKED.includes(operation)) throw new ForbiddenOperationError(operation);
        if (model === 'AuditLog' || model === 'RequestLog' || !AUDITED.includes(operation)) {
          return query(args);
        }

        const { actor, tx } = getContext();
        if (!actor) throw new ForbiddenOperationError('writing without actor');
        if (!tx) throw new ForbiddenOperationError('writing without transaction');

        const { where, data } = args as { where?: unknown; data?: unknown };
        if (hasNestedWrite(data)) throw new ForbiddenOperationError('nested writing relation');

        const delegate = (tx as unknown as Record<string, Delegate>)[
          model[0].toLocaleLowerCase() + model.slice(1)
        ];
        const before = operation === 'create' ? null : await delegate.findUnique({ where });
        const result = (await query(args)) as unknown as Row;

        await tx.auditLog.create({
          data: {
            actorId: actor.userId,
            model,
            recordId: String(result.id ?? before?.id ?? ''),
            operation,
            before: mask(before),
            after: operation === 'delete' ? Prisma.JsonNull : mask(result),
          },
        });
        return result as unknown as Row;
      },
    },
    async $executeRaw() {
      throw new ForbiddenOperationError('$executeRaw');
    },
    async $executeRawUnsafe() {
      throw new ForbiddenOperationError('$executeRawUnsafe');
    },
    async $queryRaw({ args, query }) {
      assertReadOnly(args, '$queryRaw');
      return query(args);
    },
    async $queryRawUnsafe({ args, query }) {
      assertReadOnly(args, '$queryRawUnsafe');
      return query(args);
    },
  },
});
