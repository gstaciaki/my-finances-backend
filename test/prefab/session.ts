import { faker } from '@faker-js/faker';
import { Session } from '@src/generated/prisma/client';
import { hashRefreshToken } from '@src/util/refresh-token';

type SessionInput = Partial<Session> & { userId: string };

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const genSession = ({
  id = faker.string.uuid(),
  userId,
  refreshTokenHash = hashRefreshToken(faker.string.alphanumeric(43)),
  previousRefreshTokenHash = null,
  rotatedAt = null,
  expiresAt = new Date(Date.now() + SEVEN_DAYS),
  revokedAt = null,
  createdAt = new Date(),
}: SessionInput): Session => ({
  id,
  userId,
  refreshTokenHash,
  previousRefreshTokenHash,
  rotatedAt,
  expiresAt,
  revokedAt,
  createdAt,
});
