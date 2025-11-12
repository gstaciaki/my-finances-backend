import { zPassword } from '@src/util/zod/zPassword';
import z from 'zod';

export type TokensOutput = {
  accessToken: string;
  refreshToken: string;
};

export const LoginUseCaseSchema = z.object({
  email: z.email(),
  password: zPassword(),
});

export type LoginUseCaseInput = z.infer<typeof LoginUseCaseSchema>;
export type LoginUseCaseOutput = TokensOutput;

export const RefreshTokenUseCaseSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenUseCaseInput = z.infer<typeof RefreshTokenUseCaseSchema>;
export type RefreshTokenUseCaseOutput = TokensOutput;

export type SessionControllerOutput = LoginUseCaseOutput | RefreshTokenUseCaseOutput;
