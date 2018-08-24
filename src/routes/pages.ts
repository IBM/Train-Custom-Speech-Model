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
    this.router.post('/corpus', pageController.postCorpus);
    this.router.get('/corpus', pageController.getCorpus);
    this.router.post('/corpus-status', pageController.getCorpusStatus);
    this.router.post('/lm-train', pageController.postTrain);
    this.router.get('/lm-status', pageController.getLMStatus);
    this.router.get('/list-words', pageController.listWords);
    this.router.post('/add-word', pageController.postWord);
  }
}

const pagesRoutes = new Pages();
export default pagesRoutes.router;
