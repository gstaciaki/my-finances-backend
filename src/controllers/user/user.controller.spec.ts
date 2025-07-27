import { UserController } from '@src/controllers/user/user.controller';
import { Request, Response } from 'express';
import { CreateUserUseCase } from '@src/use-cases/user/create-user/create-user.usecase';
import { ListUsersUseCase } from '@src/use-cases/user/list-users/list-users.usecase';
import { ShowUserUseCase } from '@src/use-cases/user/show-user/show-user.usecase';
import { UpdateUserUseCase } from '@src/use-cases/user/update-user/update-user.usecase';
import { DeleteUserUseCase } from '@src/use-cases/user/delete-user/delete-user.usecase';
import { right, wrong } from '@src/util/either';
import { InputValidationError } from '@src/errors/input-validation.error';
import { ZodError } from 'zod';
import { AlreadyExistsError, NotFoundError } from '@src/errors/generic.errors';

describe('UserController', () => {
  let controller: UserController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockUser = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const createUserUseCase = {
    run: jest.fn().mockResolvedValue(right(mockUser)),
  } as unknown as CreateUserUseCase;
  const listUsersUseCase = { run: jest.fn() } as unknown as ListUsersUseCase;
  const showUserUseCase = { run: jest.fn() } as unknown as ShowUserUseCase;
  const updateUserUseCase = { run: jest.fn() } as unknown as UpdateUserUseCase;
  const deleteUserUseCase = { run: jest.fn() } as unknown as DeleteUserUseCase;

  beforeEach(() => {
    controller = new UserController(
      createUserUseCase,
      listUsersUseCase,
      showUserUseCase,
      updateUserUseCase,
      deleteUserUseCase,
    );

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: jsonMock });

    mockReq = {
      body: mockUser,
    };

    mockRes = {
      status: statusMock,
      send: jsonMock,
    };
  });

  it('should return 201 if create user runs successfully', async () => {
    await controller.create(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(201);
  });

  it('should return 200 if show user runs successfully', async () => {
    (showUserUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockUser));

    const req = { params: { id: '123' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnValue({ send: jest.fn() }),
      send: jest.fn(),
    } as unknown as Response;

    await controller.show(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 200 if list users runs successfully', async () => {
    (listUsersUseCase.run as jest.Mock).mockResolvedValue(right([mockUser]));

    const req = {} as unknown as Request;
    const res = {
      status: jest.fn().mockReturnValue({ send: jest.fn() }),
      send: jest.fn(),
    } as unknown as Response;

    await controller.index(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 200 if update user runs successfully', async () => {
    (updateUserUseCase.run as jest.Mock).mockResolvedValue(right(mockUser));

    const req = { params: { id: '123' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnValue({ send: jest.fn() }),
      send: jest.fn(),
    } as unknown as Response;

    await controller.update(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 200 if delete user runs successfully', async () => {
    (deleteUserUseCase.run as jest.Mock).mockResolvedValue(right(mockUser));

    const req = { params: { id: '123' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnValue({ send: jest.fn() }),
      send: jest.fn(),
    } as unknown as Response;

    await controller.delete(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it.each([
    ['index', (c: UserController, r: Request, s: Response) => c.index(r, s)],
    ['show', (c: UserController, r: Request, s: Response) => c.show(r, s)],
    ['create', (c: UserController, r: Request, s: Response) => c.create(r, s)],
    ['update', (c: UserController, r: Request, s: Response) => c.update(r, s)],
    ['delete', (c: UserController, r: Request, s: Response) => c.delete(r, s)],
  ])('should return 400 if %s use case fails with InputValidationError', async (_, method) => {
    const error = new InputValidationError(new ZodError([]));

    (listUsersUseCase.run as jest.Mock).mockResolvedValue(wrong(error));
    (showUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));
    (createUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));
    (updateUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));
    (deleteUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));

    const req = { params: { id: '123' }, body: {} } as unknown as Request;
    const sendMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ send: sendMock });
    const res = { status: statusMock, send: sendMock } as unknown as Response;

    await method(controller, req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it.each([
    ['show', (c: UserController, r: Request, s: Response) => c.show(r, s)],
    ['update', (c: UserController, r: Request, s: Response) => c.update(r, s)],
    ['delete', (c: UserController, r: Request, s: Response) => c.delete(r, s)],
  ])('should return 404 if %s use case fails with NotFoundError', async (_, method) => {
    const error = new NotFoundError('user', 'prop', 'value');

    (showUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));
    (updateUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));
    (deleteUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));

    const req = { params: { id: '123' }, body: {} } as unknown as Request;
    const sendMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ send: sendMock });
    const res = { status: statusMock, send: sendMock } as unknown as Response;

    await method(controller, req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it.each([
    ['create', (c: UserController, r: Request, s: Response) => c.create(r, s)],
    ['update', (c: UserController, r: Request, s: Response) => c.update(r, s)],
  ])('should return 409 if %s use case fails with AlreadyExistsError', async (_, method) => {
    const error = new AlreadyExistsError('user', 'prop');

    (createUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));
    (updateUserUseCase.run as jest.Mock).mockResolvedValue(wrong(error));

    const req = { params: { id: '123' }, body: {} } as unknown as Request;
    const sendMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ send: sendMock });
    const res = { status: statusMock, send: sendMock } as unknown as Response;

    await method(controller, req, res);

    expect(statusMock).toHaveBeenCalledWith(409);
  });
});
