'use strict';

import * as util from '../util';
import { Request, Response } from 'express';


/**
 * GET /api
 */
function getApi (req: Request, res: Response) {
  res.send('Hello Custom Watson Language Model');
}

function listModels (req: Request, res: Response) {
  let speechToText = util.getSTTV1(req.app.get("stt_service").credentials);
  speechToText.listLanguageModels(null, (error: any, languageModels: any) => {
    if (error) {
      res.send(error);
    } else {
      res.send(JSON.stringify(languageModels, null, 2));
    }
  });
};


export { getApi, listModels };
