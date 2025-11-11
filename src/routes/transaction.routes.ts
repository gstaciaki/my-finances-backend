import { makeTransactionController } from '@src/factories/transaction.factory';
import { RequestHandler, Router } from 'express';

const transactionRouter = Router({ mergeParams: true });
const transactionController = makeTransactionController();

transactionRouter
  .post('/transaction', transactionController.create.bind(transactionController) as RequestHandler)
  .get('/transaction', transactionController.index.bind(transactionController) as RequestHandler)
  .get('/transaction/:id', transactionController.show.bind(transactionController) as RequestHandler)
  .put(
    '/transaction/:id',
    transactionController.update.bind(transactionController) as RequestHandler,
  )
  .delete(
    '/transaction/:id',
    transactionController.delete.bind(transactionController) as RequestHandler,
  );

export { transactionRouter };
