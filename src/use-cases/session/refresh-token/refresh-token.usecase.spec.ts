import { RefreshTokenUseCase } from './refresh-token.usecase';
import { InvalidRefreshTokenError } from '@src/errors/login.errors';
import JWT from '@src/util/jwt';
import { TokenPayload } from '@src/middlewares/auth.middleware';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    useCase = new RefreshTokenUseCase();
  });

  it('should return new tokens if refresh token is valid', async () => {
    const input = {
      refreshToken: 'valid.refresh.token',
    };

    const mockPayload: TokenPayload = {
      user: {
        id: 'user-123',
        admin: false,
      },
    };

    jest.spyOn(JWT, 'verifyToken').mockReturnValue(mockPayload);
    jest
      .spyOn(JWT, 'signToken')
      .mockReturnValueOnce('new.access.token')
      .mockReturnValueOnce('new.refresh.token');

    const result = await useCase.run(input);

    expect(result.isRight()).toBe(true);
    if (result.isWrong()) fail('Expected result to be Right');
    expect(result.value).toEqual({
      accessToken: 'new.access.token',
      refreshToken: input.refreshToken,
    });
    expect(JWT.verifyToken).toHaveBeenCalledWith(input.refreshToken);
    expect(JWT.signToken).toHaveBeenCalledWith({ userId: mockPayload.user.id });
  });

  it('should return InvalidRefreshTokenError if refresh token is invalid', async () => {
    const input = {
      refreshToken: 'invalid.refresh.token',
    };

    jest.spyOn(JWT, 'verifyToken').mockReturnValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
    expect(JWT.verifyToken).toHaveBeenCalledWith(input.refreshToken);
  });

  it('should return InvalidRefreshTokenError if refresh token is expired', async () => {
    const input = {
      refreshToken: 'expired.refresh.token',
    };

    jest.spyOn(JWT, 'verifyToken').mockReturnValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
    expect(JWT.verifyToken).toHaveBeenCalledWith(input.refreshToken);
  });

  it('should return InvalidRefreshTokenError if token payload is malformed', async () => {
    const input = {
      refreshToken: 'malformed.token',
    };

    jest.spyOn(JWT, 'verifyToken').mockReturnValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
    expect(JWT.verifyToken).toHaveBeenCalledWith(input.refreshToken);
  });

  it('should return InvalidRefreshTokenError if refreshToken is empty string', async () => {
    const input = {
      refreshToken: '',
    };

    jest.spyOn(JWT, 'verifyToken').mockReturnValue(null);

    const result = await useCase.run(input);

    expect(result.isWrong()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('should preserve the original refresh token in the response', async () => {
    const input = {
      refreshToken: 'original.refresh.token',
    };

    const mockPayload: TokenPayload = {
      user: {
        id: 'user-456',
        admin: true,
      },
    };

    jest.spyOn(JWT, 'verifyToken').mockReturnValue(mockPayload);
    jest.spyOn(JWT, 'signToken').mockReturnValue('new.access.token');

    const result = await useCase.run(input);

    expect(result.isRight()).toBe(true);
    if (result.isWrong()) fail('Expected result to be Right');
    expect(result.value.refreshToken).toBe(input.refreshToken);
  });
});
