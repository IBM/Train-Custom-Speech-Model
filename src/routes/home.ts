import { Router } from "express";

import * as homeController from "../controllers/home";
class Home {
  public router: Router;
  public constructor() {
    this.router = Router();
    this.init();
  }
  private init() {
    this.router.get("/", homeController.index);
  }
}

const homeRoutes = new Home();
export default homeRoutes.router;
