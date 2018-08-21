'use strict';
import { Router } from 'express';

import * as pageController from '../controllers/pages';

class Pages {
  public router: Router;
  public constructor() {
    this.router = Router();
    this.init();
  }
  private init() {
    this.router.get('/stt', pageController.getSTT);
    this.router.post('/stt', pageController.uploadWav, pageController.postSTT);
  }
}

const pagesRoutes = new Pages();
export default pagesRoutes.router;
