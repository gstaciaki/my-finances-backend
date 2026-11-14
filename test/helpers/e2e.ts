import { prismaRaw } from '@src/database';
import JWT from '@src/util/jwt';
import PasswordUtil from '@src/util/password';
import { genUser } from 'test/prefab/user';

export const SEED_PASSWORD = 'Password123!';

/** Cabeçalho de autenticação para um usuário (o authMiddleware só valida o token). */
export const bearer = (userId: string) => ({
  Authorization: `Bearer ${JWT.signToken({ userId })}`,
});

/**
 * Cria um usuário direto no banco, pelo cliente puro (sem auditoria), com senha
 * conhecida. Serve de estado inicial: o AuditLog dos testes só mostra o que a API fez.
 */
export async function seedUser(overrides: { name?: string; email?: string } = {}) {
  const { id, name, email } = genUser(overrides);
  const password = await PasswordUtil.hashPassword(SEED_PASSWORD, 4);
  return prismaRaw.user.create({ data: { id, name, email, password } });
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
