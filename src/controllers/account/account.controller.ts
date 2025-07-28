import { Request, Response } from 'express';
import { AbstractController } from '@src/controllers/_base/controller';
import { CreateAccountUseCase } from '@src/use-cases/account/create-account/create-account.usecase';
import { ListAccountsUseCase } from '@src/use-cases/account/list-accounts/list-accounts.usecase';
import { GetAccountUseCase } from '@src/use-cases/account/get-account/get-account.usecase';
import { UpdateAccountUseCase } from '@src/use-cases/account/update-account/update-account.usecase';
import { DeleteAccountUseCase } from '@src/use-cases/account/delete-account/delete-account.usecase';
import { DefaultFailOutput } from '@src/types/errors';
import { AccountControllerOutput } from '@src/use-cases/account/dtos';

type FailOutput = DefaultFailOutput;
type SuccessOutput = AccountControllerOutput;

export class AccountController extends AbstractController<FailOutput, SuccessOutput> {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const result = await this.listAccountsUseCase.run(req.query);
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async show(req: Request, res: Response) {
    const accountId = req.params.id;
    const result = await this.getAccountUseCase.run({ id: accountId });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async create(req: Request, res: Response) {
    const result = await this.createAccountUseCase.run(req.body);
    return result.isRight() ? this.created(req, res, result) : this.handleError(req, res, result);
  }

  async update(req: Request, res: Response) {
    const accountId = req.params.id;
    const result = await this.updateAccountUseCase.run({
      id: accountId,
      ...req.body,
    });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async delete(req: Request, res: Response) {
    const accountId = req.params.id;
    const result = await this.deleteAccountUseCase.run({ id: accountId });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }
}
