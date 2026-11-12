import { Router } from 'express';
import { userRouter } from './user.routes';
import { sessionRouter } from './session.routes';

const routes = Router();

routes.use(sessionRouter);

routes.use('/user', userRouter);

export { routes };
