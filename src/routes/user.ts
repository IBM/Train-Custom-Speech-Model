import { Router } from "express";
import * as userController from "../controllers/user";

class UserRouter {
  public router: Router;
  public constructor() {
    this.router = Router();
    this.init();
  }
  private init() {
    this.router.get("/login", userController.getLogin);
    this.router.post("/login", userController.postLogin);
  }
}

const userRouter = new UserRouter();
export default userRouter.router;
