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
  let speech = util.getSTTV1(req.app.get("stt_service").credentials);
  speech.listLanguageModels(null, (error: any, languageModels: any) => {
    if (error) {
      res.send(error);
    } else {
      res.send(JSON.stringify(languageModels, null, 2));
    }
  });
};

async function getModel(req: Request, res: Response) {
  let rev = await util.getModelStatus(req.app.get('stt_service').credentials, req.user.customModel);
  if (rev[0]) {
    res.send(JSON.stringify({error: rev[0]}, null, 2));
  } else {
    res.send(JSON.stringify(rev[1], null, 2));
  }
}


export { getApi, listModels, getModel };
