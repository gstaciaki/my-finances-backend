import { Request, Response } from 'express';
import { AbstractController } from '@src/controllers/_base/controller';
import { CreateTransactionUseCase } from '@src/use-cases/transaction/create-transaction/create-transaction.usecase';
import { ListTransactionsUseCase } from '@src/use-cases/transaction/list-transactions/list-transaction.usecase';
import { GetTransactionUseCase } from '@src/use-cases/transaction/get-transaction/get-transaction.usecase';
import { UpdateTransactionUseCase } from '@src/use-cases/transaction/update-transaction/update-transaction.usecase';
import { DeleteTransactionUseCase } from '@src/use-cases/transaction/delete-transaction/delete-transaction.usecase';
import { DefaultFailOutput } from '@src/types/errors';
import { TransactionControllerOutput } from '@src/use-cases/transaction/dtos';
import { BasePaginatorInput } from '@src/util/zod/paginator';

type FailOutput = DefaultFailOutput;
type SuccessOutput = TransactionControllerOutput;

export class TransactionController extends AbstractController<FailOutput, SuccessOutput> {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const { accountId } = req.params;
    const result = await this.listTransactionsUseCase.run({
      accountId,
      ...(req.query as unknown as BasePaginatorInput),
    });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async show(req: Request, res: Response) {
    const transactionId = req.params.id;
    const result = await this.getTransactionUseCase.run({ id: transactionId });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async create(req: Request, res: Response) {
    const { accountId } = req.params;
    const result = await this.createTransactionUseCase.run({ accountId, ...req.body });
    return result.isRight() ? this.created(req, res, result) : this.handleError(req, res, result);
  }

  async update(req: Request, res: Response) {
    const transactionId = req.params.id;
    const result = await this.updateTransactionUseCase.run({
      id: transactionId,
      ...req.body,
    });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async delete(req: Request, res: Response) {
    const transactionId = req.params.id;
    const result = await this.deleteTransactionUseCase.run({ id: transactionId });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }
}
