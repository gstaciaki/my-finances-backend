import { prismaRaw } from '@src/database';
import { Session } from '@src/generated/prisma/client';
import JWT from '@src/util/jwt';
import PasswordUtil from '@src/util/password';
import { genSession } from 'test/prefab/session';
import { genUser } from 'test/prefab/user';

export const SEED_PASSWORD = 'Password123!';

/**
 * Cabeçalho de autenticação para um token com esse `userId` e `sessionId`. Só monta o token:
 * para o authMiddleware aceitar, o usuário e a sessão precisam existir no banco
 * (ver `authenticate`).
 */
export const bearer = (userId: string, sessionId: string) => ({
  Authorization: `Bearer ${JWT.signAccessToken({ userId, sessionId })}`,
});

/**
 * Cria um usuário direto no banco, pelo cliente puro (sem auditoria), com senha
 * conhecida. Serve de estado inicial: o AuditLog dos testes só mostra o que a API fez.
 */
export async function seedUser(
  overrides: { name?: string; email?: string; admin?: boolean; deletedAt?: Date | null } = {},
) {
  const { name, email, admin = false, deletedAt = null } = overrides;
  const { id, name: genName, email: genEmail } = genUser({ name, email });
  const password = await PasswordUtil.hashPassword(SEED_PASSWORD, 4);
  return prismaRaw.user.create({
    data: { id, name: genName, email: genEmail, password, admin, deletedAt },
  });
}

/** Cria uma Sessão direto no banco, pelo cliente puro (sem auditoria). Vale 7 dias, ativa. */
export const seedSession = (userId: string, overrides: Partial<Session> = {}) =>
  prismaRaw.session.create({ data: genSession({ ...overrides, userId }) });

/**
 * Cria um usuário e uma Sessão ativa e devolve o cabeçalho `Authorization` que o
 * authMiddleware aceita. É o jeito de chamar rotas protegidas nos e2e.
 */
export async function authenticate(
  overrides: { admin?: boolean; name?: string; email?: string } = {},
) {
  const user = await seedUser(overrides);
  const session = await seedSession(user.id);
  return { user, session, headers: bearer(user.id, session.id) };
}

export const auditRows = () => prismaRaw.auditLog.findMany({ orderBy: { at: 'asc' } });

/**
 * O middleware grava o RequestLog depois da resposta e sem `await`, então o teste
 * precisa esperar a linha aparecer.
 */
export async function waitForRequestLogs(count = 1, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const rows = await prismaRaw.requestLog.findMany({ orderBy: { at: 'asc' } });
    if (rows.length >= count || Date.now() > deadline) return rows;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}
