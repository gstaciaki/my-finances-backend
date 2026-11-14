import { SessionController } from '@src/controllers/session/session.controller';
import { prisma } from '@src/database';
import { UserRepository } from '@src/repositories/user/user.repository';
import { LoginUseCase } from '@src/use-cases/session/login/login.usecase';
import { RefreshTokenUseCase } from '@src/use-cases/session/refresh-token/refresh-token.usecase';

export function makeSessionController(): SessionController {
  const userRepo = new UserRepository(prisma);

  const loginUseCase = new LoginUseCase(userRepo);
  const refreshTokenUseCase = new RefreshTokenUseCase();

  return new SessionController(loginUseCase, refreshTokenUseCase);
}
