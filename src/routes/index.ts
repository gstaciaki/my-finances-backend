import { Router } from 'express';
import { userRouter } from './user.routes';
import { accountRouter } from './account.routes';
import { transactionRouter } from './transaction.routes';
import { sessionRouter } from './session.routes';

const routes = Router();

routes.use(sessionRouter);

routes.use('/user', userRouter);

routes.use(accountRouter);

routes.use('/account/:accountId', transactionRouter);

export { routes };
