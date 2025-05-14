import { makeUserController } from '@src/factories/user.factory';
import { RequestHandler, Router } from 'express';

const userRouter = Router();
const userController = makeUserController();

userRouter
  .post('/user', userController.create.bind(userController) as RequestHandler)
  .get('/user', userController.index.bind(userController) as RequestHandler)
  .get('/user/:id', userController.show.bind(userController) as RequestHandler)
  .put('/user/:id', userController.update.bind(userController) as RequestHandler)
  .delete('/user/:id', userController.delete.bind(userController) as RequestHandler);

export { userRouter };
