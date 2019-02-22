'use strict';
import { Router } from 'express';

import * as apiController from '../controllers/api';
import * as userController from '../controllers/user';

class Api {
  public router: Router;
  public constructor() {
    this.router = Router();
    this.init();
  }
  private init() {
    // General STT API endpoints.
    this.router.get('/model', apiController.getModel);
    this.router.post('/transcribe', apiController.uploadAudio, apiController.postTranscribe);

    this.router.post('/train', apiController.trainModel);
    this.router.post('/train-acoustic', apiController.trainAcousticModel);

    this.router.get('/acoustic-model', apiController.getAcousticModel);

    this.router.get('/audio', apiController.listAudio);
    this.router.delete('/audio/:name', apiController.deleteAudio);
    this.router.post('/audio', apiController.uploadAudio, apiController.postAudio);

    this.router.get('/corpora', apiController.getCorpora);
    this.router.delete('/corpora/:name', apiController.deleteCorpus);
    this.router.post('/corpora', apiController.postCorpus);

    this.router.get('/words', apiController.getWords);
    this.router.post('/words', apiController.addWord);
    this.router.delete('/words/:name', apiController.deleteWord);
    // User endpoints
    this.router.post('/login', userController.postLogin);
    this.router.post('/logout', userController.postLogout);
    this.router.get('/user', userController.getUser);
  }
}

const apiRoutes = new Api();
export default apiRoutes.router;
