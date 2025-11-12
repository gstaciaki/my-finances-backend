import { makeUserController } from '@src/factories/user.factory';
import { authMiddleware } from '@src/middlewares/auth.middleware';
import { Router } from 'express';

const userRouter = Router();
const userController = makeUserController();

userRouter.use(authMiddleware);

userRouter
  .post('/', userController.create.bind(userController))
  .get('/', userController.index.bind(userController))
  .get('/:id', userController.show.bind(userController))
  .patch('/:id', userController.update.bind(userController))
  .delete('/:id', userController.delete.bind(userController))
  .post('/change-password', userController.changePassword.bind(userController));

export { userRouter };
