import { AccountController } from '@src/controllers/account/account.controller';
import { Request, Response } from 'express';
import { CreateAccountUseCase } from '@src/use-cases/account/create-account/create-account.usecase';
import { ListAccountsUseCase } from '@src/use-cases/account/list-accounts/list-accounts.usecase';
import { GetAccountUseCase } from '@src/use-cases/account/get-account/get-account.usecase';
import { UpdateAccountUseCase } from '@src/use-cases/account/update-account/update-account.usecase';
import { DeleteAccountUseCase } from '@src/use-cases/account/delete-account/delete-account.usecase';
import { right, wrong } from '@src/util/either';
import { InputValidationError } from '@src/errors/input-validation.error';
import { ZodError } from 'zod';
import { AlreadyExistsError, NotFoundError } from '@src/errors/generic.errors';

describe('AccountController', () => {
  let controller: AccountController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockAccount = {
    id: 'acc-123',
    name: 'Main Account',
    users: [],
  };

  const createAccountUseCase = {
    run: jest.fn().mockResolvedValue(right(mockAccount)),
  } as unknown as CreateAccountUseCase;
  const listAccountsUseCase = { run: jest.fn() } as unknown as ListAccountsUseCase;
  const getAccountUseCase = { run: jest.fn() } as unknown as GetAccountUseCase;
  const updateAccountUseCase = { run: jest.fn() } as unknown as UpdateAccountUseCase;
  const deleteAccountUseCase = { run: jest.fn() } as unknown as DeleteAccountUseCase;

  beforeEach(() => {
    controller = new AccountController(
      createAccountUseCase,
      listAccountsUseCase,
      getAccountUseCase,
      updateAccountUseCase,
      deleteAccountUseCase,
    );

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: jsonMock });

    mockReq = { body: mockAccount };
    mockRes = {
      status: statusMock,
      send: jsonMock,
    };
  });

  it('should return 201 if create account runs successfully', async () => {
    await controller.create(mockReq as unknown as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(201);
  });

  it('should return 200 if list accounts runs successfully', async () => {
    (listAccountsUseCase.run as jest.Mock).mockResolvedValueOnce(right([mockAccount]));
    await controller.index({ query: {} } as unknown as Request, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should return 200 if get account runs successfully', async () => {
    (getAccountUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockAccount));
    const req = { params: { id: 'acc-123' } } as unknown as unknown as Request;
    await controller.show(req, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should return 200 if update account runs successfully', async () => {
    (updateAccountUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockAccount));
    const req = {
      params: { id: 'acc-123' },
      body: { name: 'Updated' },
    } as unknown as unknown as Request;
    await controller.update(req, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should return 200 if delete account runs successfully', async () => {
    (deleteAccountUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockAccount));
    const req = { params: { id: 'acc-123' } } as unknown as unknown as Request;
    await controller.delete(req, mockRes as Response);
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it.each([
    ['index', (c: AccountController, r: Request, s: Response) => c.index(r, s)],
    ['show', (c: AccountController, r: Request, s: Response) => c.show(r, s)],
    ['create', (c: AccountController, r: Request, s: Response) => c.create(r, s)],
    ['update', (c: AccountController, r: Request, s: Response) => c.update(r, s)],
    ['delete', (c: AccountController, r: Request, s: Response) => c.delete(r, s)],
  ])('should return 400 if %s use case fails with InputValidationError', async (_, method) => {
    const error = new InputValidationError(new ZodError([]));

    jest.spyOn(listAccountsUseCase, 'run').mockResolvedValue(wrong(error));
    jest.spyOn(getAccountUseCase, 'run').mockResolvedValue(wrong(error));
    jest.spyOn(createAccountUseCase, 'run').mockResolvedValue(wrong(error));
    jest.spyOn(updateAccountUseCase, 'run').mockResolvedValue(wrong(error));
    jest.spyOn(deleteAccountUseCase, 'run').mockResolvedValue(wrong(error));

    const req = { params: { id: 'acc-123' }, body: {} } as unknown as Request;
    const res = { status: statusMock, send: jsonMock } as unknown as Response;

    await method(controller, req, res);
    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it.each([
    ['show', (c: AccountController, r: Request, s: Response) => c.show(r, s)],
    ['update', (c: AccountController, r: Request, s: Response) => c.update(r, s)],
    ['delete', (c: AccountController, r: Request, s: Response) => c.delete(r, s)],
  ])('should return 404 if %s use case fails with NotFoundError', async (_, method) => {
    const error = new NotFoundError('account', 'id', 'acc-123');

    jest.spyOn(getAccountUseCase, 'run').mockResolvedValue(wrong(error));
    jest.spyOn(updateAccountUseCase, 'run').mockResolvedValue(wrong(error));
    jest.spyOn(deleteAccountUseCase, 'run').mockResolvedValue(wrong(error));

    const req = { params: { id: 'acc-123' }, body: {} } as unknown as Request;
    const res = { status: statusMock, send: jsonMock } as unknown as Response;

    await method(controller, req, res);
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it.each([
    ['create', (c: AccountController, r: Request, s: Response) => c.create(r, s)],
    ['update', (c: AccountController, r: Request, s: Response) => c.update(r, s)],
  ])('should return 409 if %s use case fails with AlreadyExistsError', async (_, method) => {
    const error = new AlreadyExistsError('account', 'name');

    jest.spyOn(createAccountUseCase, 'run').mockResolvedValue(wrong(error));
    jest.spyOn(updateAccountUseCase, 'run').mockResolvedValue(wrong(error));

    const req = { params: { id: 'acc-123' }, body: {} } as unknown as Request;
    const res = { status: statusMock, send: jsonMock } as unknown as Response;

    await method(controller, req, res);
    expect(statusMock).toHaveBeenCalledWith(409);
  });
});
