import { SessionController } from '@src/controllers/session/session.controller';
import { Request, Response } from 'express';
import { LoginUseCase } from '@src/use-cases/session/login/login.usecase';
import { RefreshTokenUseCase } from '@src/use-cases/session/refresh-token/refresh-token.usecase';
import { right, wrong } from '@src/util/either';
import { InputValidationError } from '@src/errors/input-validation.error';
import { ZodError } from 'zod';
import { EmailOrPasswordWrongError, InvalidRefreshTokenError } from '@src/errors/login.errors';

describe('SessionController', () => {
  let controller: SessionController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
  };

  const loginUseCase = {
    run: jest.fn().mockResolvedValue(right(mockTokens)),
  } as unknown as LoginUseCase;

  const refreshTokenUseCase = {
    run: jest.fn().mockResolvedValue(right(mockTokens)),
  } as unknown as RefreshTokenUseCase;

  beforeEach(() => {
    controller = new SessionController(loginUseCase, refreshTokenUseCase);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: jsonMock });

    mockReq = {
      body: {
        email: 'user@example.com',
        password: 'Password123!',
      },
    };

    mockRes = {
      status: statusMock,
      send: jsonMock,
    };
  });

  describe('login', () => {
    it('should return 200 if login runs successfully', async () => {
      await controller.login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockTokens);
    });

    it('should return 400 if login fails with InputValidationError', async () => {
      const error = new InputValidationError(new ZodError([]));
      (loginUseCase.run as jest.Mock).mockResolvedValue(wrong(error));

      const req = {
        body: {
          email: 'invalid-email',
          password: 'weak',
        },
      } as unknown as Request;
      const sendMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ send: sendMock });
      const res = { status: statusMock, send: sendMock } as unknown as Response;

      await controller.login(req, res);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 401 if login fails with EmailOrPasswordWrongError', async () => {
      const error = new EmailOrPasswordWrongError();
      (loginUseCase.run as jest.Mock).mockResolvedValue(wrong(error));

      const req = {
        body: {
          email: 'user@example.com',
          password: 'WrongPassword123!',
        },
      } as unknown as Request;
      const sendMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ send: sendMock });
      const res = { status: statusMock, send: sendMock } as unknown as Response;

      await controller.login(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('refresh', () => {
    it('should return 200 if refresh runs successfully', async () => {
      const req = {
        body: {
          refreshToken: 'valid.refresh.token',
        },
      } as unknown as Request;
      const sendMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ send: sendMock });
      const res = { status: statusMock, send: sendMock } as unknown as Response;

      (refreshTokenUseCase.run as jest.Mock).mockResolvedValue(right(mockTokens));

      await controller.refresh(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(sendMock).toHaveBeenCalledWith(mockTokens);
    });

    it('should return 400 if refresh fails with InputValidationError', async () => {
      const error = new InputValidationError(new ZodError([]));
      (refreshTokenUseCase.run as jest.Mock).mockResolvedValue(wrong(error));

      const req = {
        body: {
          refreshToken: '',
        },
      } as unknown as Request;
      const sendMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ send: sendMock });
      const res = { status: statusMock, send: sendMock } as unknown as Response;

      await controller.refresh(req, res);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 401 if refresh fails with InvalidRefreshTokenError', async () => {
      const error = new InvalidRefreshTokenError();
      (refreshTokenUseCase.run as jest.Mock).mockResolvedValue(wrong(error));

      const req = {
        body: {
          refreshToken: 'invalid.refresh.token',
        },
      } as unknown as Request;
      const sendMock = jest.fn();
      const statusMock = jest.fn().mockReturnValue({ send: sendMock });
      const res = { status: statusMock, send: sendMock } as unknown as Response;

      await controller.refresh(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });
});

