import { TransactionController } from '@src/controllers/transaction/transaction.controller';
import { Request, Response } from 'express';
import { CreateTransactionUseCase } from '@src/use-cases/transaction/create-transaction/create-transaction.usecase';
import { ListTransactionsUseCase } from '@src/use-cases/transaction/list-transactions/list-transaction.usecase';
import { GetTransactionUseCase } from '@src/use-cases/transaction/get-transaction/get-transaction.usecase';
import { UpdateTransactionUseCase } from '@src/use-cases/transaction/update-transaction/update-transaction.usecase';
import { DeleteTransactionUseCase } from '@src/use-cases/transaction/delete-transaction/delete-transaction.usecase';
import { right, wrong } from '@src/util/either';
import { InputValidationError } from '@src/errors/input-validation.error';
import { ZodError } from 'zod';
import { AlreadyExistsError, NotFoundError } from '@src/errors/generic.errors';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';

describe('TransactionController', () => {
  let controller: TransactionController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const mockAccount = genAccount();
  const mockTransaction = genTransaction({ account: mockAccount });

  const createTransactionUseCase = {
    run: jest.fn().mockResolvedValue(right(mockTransaction)),
  } as unknown as CreateTransactionUseCase;
  const listTransactionsUseCase = {
    run: jest.fn(),
  } as unknown as ListTransactionsUseCase;
  const getTransactionUseCase = { run: jest.fn() } as unknown as GetTransactionUseCase;
  const updateTransactionUseCase = { run: jest.fn() } as unknown as UpdateTransactionUseCase;
  const deleteTransactionUseCase = { run: jest.fn() } as unknown as DeleteTransactionUseCase;

  beforeEach(() => {
    controller = new TransactionController(
      createTransactionUseCase,
      listTransactionsUseCase,
      getTransactionUseCase,
      updateTransactionUseCase,
      deleteTransactionUseCase,
    );

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: jsonMock });

    mockReq = { body: mockTransaction };
    mockRes = {
      status: statusMock,
      send: jsonMock,
    };
  });

  describe('create', () => {
    it('deve retornar 201 se criar transação com sucesso', async () => {
      const req = { params: { accountId: mockAccount.id }, body: {} } as unknown as Request;
      await controller.create(req, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe('index', () => {
    it('deve retornar 200 se listar transações com sucesso', async () => {
      const mockPaginatedResult = {
        data: [mockTransaction],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };

      (listTransactionsUseCase.run as jest.Mock).mockResolvedValueOnce(
        right(mockPaginatedResult),
      );
      await controller.index(
        {
          params: { accountId: mockAccount.id },
          query: { page: 1, limit: 10 },
        } as unknown as Request,
        mockRes as Response,
      );
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('show', () => {
    it('deve retornar 200 se buscar transação com sucesso', async () => {
      (getTransactionUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockTransaction));
      const req = {
        params: { id: mockTransaction.id, accountId: mockAccount.id },
      } as unknown as Request;
      await controller.show(req, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('update', () => {
    it('deve retornar 200 se atualizar transação com sucesso', async () => {
      (updateTransactionUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockTransaction));
      const req = {
        params: { id: mockTransaction.id, accountId: mockAccount.id },
        body: { amount: 2000 },
      } as unknown as Request;
      await controller.update(req, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('deve retornar 200 se deletar transação com sucesso', async () => {
      (deleteTransactionUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockTransaction));
      const req = {
        params: { id: mockTransaction.id, accountId: mockAccount.id },
      } as unknown as Request;
      await controller.delete(req, mockRes as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  describe('Tratamento de erros - InputValidationError', () => {
    it.each([
      ['index', (c: TransactionController, r: Request, s: Response) => c.index(r, s)],
      ['show', (c: TransactionController, r: Request, s: Response) => c.show(r, s)],
      ['create', (c: TransactionController, r: Request, s: Response) => c.create(r, s)],
      ['update', (c: TransactionController, r: Request, s: Response) => c.update(r, s)],
      ['delete', (c: TransactionController, r: Request, s: Response) => c.delete(r, s)],
    ])(
      'deve retornar 400 se %s use case falhar com InputValidationError',
      async (_, method) => {
        const error = new InputValidationError(new ZodError([]));

        jest.spyOn(listTransactionsUseCase, 'run').mockResolvedValue(wrong(error));
        jest.spyOn(getTransactionUseCase, 'run').mockResolvedValue(wrong(error));
        jest.spyOn(createTransactionUseCase, 'run').mockResolvedValue(wrong(error));
        jest.spyOn(updateTransactionUseCase, 'run').mockResolvedValue(wrong(error));
        jest.spyOn(deleteTransactionUseCase, 'run').mockResolvedValue(wrong(error));

        const req = {
          params: { id: mockTransaction.id, accountId: mockAccount.id },
          body: {},
          query: {},
        } as unknown as Request;
        const res = { status: statusMock, send: jsonMock } as unknown as Response;

        await method(controller, req, res);
        expect(statusMock).toHaveBeenCalledWith(400);
      },
    );
  });

  describe('Tratamento de erros - NotFoundError', () => {
    it.each([
      ['show', (c: TransactionController, r: Request, s: Response) => c.show(r, s)],
      ['update', (c: TransactionController, r: Request, s: Response) => c.update(r, s)],
      ['delete', (c: TransactionController, r: Request, s: Response) => c.delete(r, s)],
    ])('deve retornar 404 se %s use case falhar com NotFoundError', async (_, method) => {
      const error = new NotFoundError('transação', 'id', mockTransaction.id);

      jest.spyOn(getTransactionUseCase, 'run').mockResolvedValue(wrong(error));
      jest.spyOn(updateTransactionUseCase, 'run').mockResolvedValue(wrong(error));
      jest.spyOn(deleteTransactionUseCase, 'run').mockResolvedValue(wrong(error));

      const req = {
        params: { id: mockTransaction.id, accountId: mockAccount.id },
        body: {},
      } as unknown as Request;
      const res = { status: statusMock, send: jsonMock } as unknown as Response;

      await method(controller, req, res);
      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('Tratamento de erros - AlreadyExistsError', () => {
    it.each([
      ['create', (c: TransactionController, r: Request, s: Response) => c.create(r, s)],
      ['update', (c: TransactionController, r: Request, s: Response) => c.update(r, s)],
    ])('deve retornar 409 se %s use case falhar com AlreadyExistsError', async (_, method) => {
      const error = new AlreadyExistsError('transação', 'id');

      jest.spyOn(createTransactionUseCase, 'run').mockResolvedValue(wrong(error));
      jest.spyOn(updateTransactionUseCase, 'run').mockResolvedValue(wrong(error));

      const req = {
        params: { id: mockTransaction.id, accountId: mockAccount.id },
        body: {},
      } as unknown as Request;
      const res = { status: statusMock, send: jsonMock } as unknown as Response;

      await method(controller, req, res);
      expect(statusMock).toHaveBeenCalledWith(409);
    });
  });

  describe('Integração entre métodos', () => {
    it('deve passar o ID correto do params para show', async () => {
      const transactionId = 'abc-123-def';
      (getTransactionUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockTransaction));

      const req = { params: { id: transactionId } } as unknown as Request;
      await controller.show(req, mockRes as Response);

      expect(getTransactionUseCase.run).toHaveBeenCalledWith({ id: transactionId });
    });

    it('deve passar o ID e body corretos para update', async () => {
      const transactionId = 'xyz-456-abc';
      const updateData = { amount: 3000, description: 'Atualizado' };
      (updateTransactionUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockTransaction));

      const req = {
        params: { id: transactionId },
        body: updateData,
      } as unknown as Request;
      await controller.update(req, mockRes as Response);

      expect(updateTransactionUseCase.run).toHaveBeenCalledWith({
        id: transactionId,
        ...updateData,
      });
    });

    it('deve passar o ID correto para delete', async () => {
      const transactionId = 'delete-123';
      (deleteTransactionUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockTransaction));

      const req = { params: { id: transactionId } } as unknown as Request;
      await controller.delete(req, mockRes as Response);

      expect(deleteTransactionUseCase.run).toHaveBeenCalledWith({ id: transactionId });
    });

    it('deve passar query params para index', async () => {
      const queryParams = { page: 2, limit: 20 };
      const mockResult = {
        data: [mockTransaction],
        page: 2,
        limit: 20,
        total: 50,
        totalPages: 3,
      };
      (listTransactionsUseCase.run as jest.Mock).mockResolvedValueOnce(right(mockResult));

      const req = {
        params: { accountId: mockAccount.id },
        query: queryParams,
      } as unknown as Request;
      await controller.index(req, mockRes as Response);

      expect(listTransactionsUseCase.run).toHaveBeenCalledWith({
        accountId: mockAccount.id,
        ...queryParams,
      });
    });
  });
});

