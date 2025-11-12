import { makeSessionController } from '@src/factories/session.factory';
import { Router } from 'express';

const sessionRouter = Router();
const sessionController = makeSessionController();

sessionRouter
  .post('/login', sessionController.login.bind(sessionController))
  .post('/refresh', sessionController.refresh.bind(sessionController));

export { sessionRouter };
