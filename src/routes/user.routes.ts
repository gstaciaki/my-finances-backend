import { makeUserController } from "@src/factories/user.factory";
import { Router } from "express";

const userRouter = Router();
const userController = makeUserController();

userRouter
  .post("/user", (req, res) => userController.create(req, res))
  .get("/user", (req, res) => userController.index(req, res))
  .get("/user/:id", (req, res) => userController.show(req, res))
  .put("/user/:id", (req, res) => userController.update(req, res))
  .delete("/user/:id", (req, res) => userController.delete(req, res));

export { userRouter };
