import { UpdateTransactionUseCase } from './update-transaction.usecase';
import { ITransacationRepository } from '@src/repositories/transaction/transaction.repository';
import { NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { genTransaction } from 'test/prefab/transaction';
import { genAccount } from 'test/prefab/account';
import { expectWrong } from 'test/helpers/expect-wrong';
import { expectRight } from 'test/helpers/expect-right';

describe('UpdateTransactionUseCase', () => {
  let transactionRepo: jest.Mocked<ITransacationRepository>;
  let useCase: UpdateTransactionUseCase;

  beforeEach(() => {
    transactionRepo = {
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findWhere: jest.fn(),
      update: jest.fn(),
    };

    useCase = new UpdateTransactionUseCase(transactionRepo);
  });

  describe('Validação de entrada', () => {
    it('deve retornar InputValidationError se ID é inválido', async () => {
      const input = {
        id: 'not-a-uuid',
        amount: 1000,
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se ID está vazio', async () => {
      const input = {
        id: '',
        amount: 1000,
      };

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });

    it('deve retornar InputValidationError se ID não é fornecido', async () => {
      const input = {
        amount: 1000,
      } as any;

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(error).toBeInstanceOf(InputValidationError);
    });
  });

  describe('Regras de negócio', () => {
    it('deve retornar NotFoundError se a transação não existe', async () => {
      const input = {
        id: 'ea9be323-c6c9-47d5-8ec9-8fb122f20192',
        amount: 2000,
      };

      transactionRepo.findById.mockResolvedValue(null);

      const result = await useCase.run(input);
      const error = expectWrong(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain('transação');
    });
  });

  describe('Atualização de transação com sucesso', () => {
    it('deve atualizar a transação se o input é válido e a transação existe', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        amount: 2000,
        description: 'Atualizado',
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000,
        description: 'Original',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          amount: input.amount,
          description: input.description,
          accountId: account.id,
        }),
      );

      expect(updated.amount).toBe(input.amount);
      expect(updated.description).toBe(input.description);
      expect(updated.id).toBe(transaction.id);
    });

    it('deve atualizar apenas o amount da transação', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        amount: 3000,
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000,
        description: 'Descrição original',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          amount: input.amount,
          accountId: account.id,
        }),
      );

      expect(updated.amount).toBe(input.amount);
      expect(updated.id).toBe(transaction.id);
    });

    it('deve atualizar apenas a description da transação', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        description: 'Nova descrição',
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000,
        description: 'Original',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.findById).toHaveBeenCalledWith(input.id);
      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          description: input.description,
          accountId: account.id,
        }),
      );

      expect(updated.description).toBe(input.description);
      expect(updated.id).toBe(transaction.id);
    });

    it('deve atualizar description para null', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        description: null,
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000,
        description: 'Descrição existente',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          description: null,
          accountId: account.id,
        }),
      );

      expect(updated.description).toBeNull();
    });

    it('deve preservar o accountId ao atualizar', async () => {
      const account = genAccount();
      const transaction = genTransaction({ account, amount: 1000 });
      const input = {
        id: transaction.id,
        amount: 5000,
      };

      const dbTransaction = {
        id: transaction.id,
        amount: 1000,
        description: 'Descrição',
        accountId: account.id,
        account: account,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };

      transactionRepo.findById.mockResolvedValue(dbTransaction);
      transactionRepo.update.mockResolvedValue(dbTransaction as any);

      const result = await useCase.run(input);
      const updated = expectRight(result);

      expect(transactionRepo.update).toHaveBeenCalledWith(
        input.id,
        expect.objectContaining({
          accountId: account.id,
        }),
      );

      expect(updated.account.id).toBe(account.id);
    });
  });
});

