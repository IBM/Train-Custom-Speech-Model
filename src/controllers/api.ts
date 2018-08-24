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

async function getCorpus(req: Request, res: Response) {
  if (req.query.corpus) {
    let id = await util.getCustomModelId(req.app.get('stt_service').credentials, req.user.customModel);
    let status = await util.getCorpus(req.app.get('stt_service').credentials, id[1], req.query.corpus);
    if (status[0]) {
      res.send(JSON.stringify({error: status[0]}, null, 2));
    } else {
      res.send(JSON.stringify(status[1], null, 2));
    }
  } else {
    res.send(JSON.stringify({error: 'no corpus name'}, null, 2));
  }
}

async function getWord(req: Request, res: Response) {
  if (req.query.word) {
    let id = await util.getCustomModelId(req.app.get('stt_service').credentials, req.user.customModel);
    let stt = util.getSTTV1(req.app.get('stt_service').credentials);
    stt.getWord({'customization_id': id[1],'word_name': req.query.word}, (error: any, result: any)=>{
        if (error) {
        res.send(JSON.stringify({error: error}, null, 2));
      } else {
        res.send(JSON.stringify(result, null, 2));
      }
    });
  }
  else{
    res.send({})
  }
}
export { getApi, listModels, getModel, getCorpus, getWord };
