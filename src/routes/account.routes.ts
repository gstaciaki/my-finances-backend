import { makeAccountController } from '@src/factories/account.factory';
import { authMiddleware } from '@src/middlewares/auth.middleware';
import { RequestHandler, Router } from 'express';

const accountRouter = Router();
const accountController = makeAccountController();

accountRouter.use(authMiddleware);

accountRouter
  .post('/account', accountController.create.bind(accountController) as RequestHandler)
  .get('/account', accountController.index.bind(accountController) as RequestHandler)
  .get('/account/:id', accountController.show.bind(accountController) as RequestHandler)
  .put('/account/:id', accountController.update.bind(accountController) as RequestHandler)
  .delete('/account/:id', accountController.delete.bind(accountController) as RequestHandler);

export { accountRouter };
