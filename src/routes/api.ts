'use strict';
import { Router } from 'express';

import * as apiController from '../controllers/api';

class Api {
  public router: Router;
  public constructor() {
    this.router = Router();
    this.init();
  }
  private init() {
    this.router.get('/', apiController.getApi);
    this.router.get('/listModels', apiController.listModels);
    this.router.get('/getModel', apiController.getModel);
  }
}

const apiRoutes = new Api();
export default apiRoutes.router;
