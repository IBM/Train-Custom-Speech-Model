'use strict';

import * as util from '../util';
import * as multer from 'multer';
import * as stream from 'stream';
import { Request, Response, RequestHandler } from 'express';
import { getWord } from './api';

let upload = multer({ storage: multer.memoryStorage() });
/**
 * GET /stt
 */
function getSTT (req: Request, res: Response) {
  res.render('pages/stt', {
    title: 'Speech to Text',
    options: [
      {name: 'en-US_BroadbandModel', value: 'en-US_BroadbandModel'},
      {name: req.user.customModel, value: req.user.customModel}
    ]
  });
}

/**
 * Handle the wav file upload
 */
let uploadWav: RequestHandler = upload.single('wav');

interface RecognizeParams {
  audio: stream.Readable;
  content_type: string;
  model: string;
  customization_id?: string;
}

/**
 * POST /stt
 */
async function postSTT (req: Request, res: Response) {
  let speechToText = util.getSTTV1(req.app.get('stt_service').credentials);
  let bufferStream = new stream.PassThrough();
  bufferStream.end( req.file.buffer );
  let types = ['wav', 'mp3', 'flac'];
  let type = req.file.originalname.split('.').pop();
  if (types.indexOf(type) == -1) {
    console.log("Wrong file type");
    return res.render('pages/stt', {
      title: 'Speech to Text',
      error: `File extension must be ${types.join(',')}`,
      options: [
        {name: 'en-US_BroadbandModel', value: 'en-US_BroadbandModel'},
        {name: req.user.customModel, value: req.user.customModel}
      ]
    });
  }
  let recognizeParams: RecognizeParams = {
    audio: bufferStream,
    content_type: `audio/${type}`,
    model: 'en-US_BroadbandModel'
  };

  let id = await util.getCustomModelId(req.app.get('stt_service').credentials, req.user.customModel);
  if (req.body.model !== 'en-US_BroadbandModel') {
    recognizeParams.customization_id = id[1];
    delete recognizeParams.model;
  }
  speechToText.recognize(recognizeParams, (error: any, results: any) => {
    if (error) {
      res.send(error);
    } else {
      let index = results['result_index'] || 0;
      let result = results.results[index];
      if (!result) {
        res.send('no result!');
      } else {
        res.render('pages/custom-lm', {
          title: 'Custom Language Model',
          customModel: req.user.customModel,
          text: result.alternatives[0].transcript
        });
      }
    }
  });

};

function getCorpus(req: Request, res: Response) {
  res.render('pages/custom-lm', {
    title: 'Custom Language Model',
    customModel: req.user.customModel,
    text: ''
  });
}

async function getCorpusStatus(req: Request, res: Response) {
  let id = await util.getCustomModelId(req.app.get('stt_service').credentials, req.user.customModel);
  let status = await util.getCorpus(req.app.get('stt_service').credentials, id[1], req.body.corpusName);
  res.render('pages/corpus-status', {
    title: 'Corpus Status',
    customModel: req.user.customModel,
    status: status[1]
  });
}

async function postCorpus(req: Request, res: Response) {
  let id = await util.getCustomModelId(req.app.get('stt_service').credentials, req.user.customModel);
  let rev = await util.addCorpus(req.app.get('stt_service').credentials, id[1], req.body.corpusName, req.body.corpus);
  if (rev) {
    res.send(rev);
  } else {
    getCorpusStatus(req, res);
  }
}

async function postTrain(req: Request, res: Response) {
  let rev = await util.trainModel(req.app.get('stt_service').credentials, req.user.customModel);
  if (rev) {
    res.send(rev);
  } else {
    res.redirect('/pages/lm-status');
  }
}

async function getLMStatus(req: Request, res: Response) {
  let rev = await util.getModelStatus(req.app.get('stt_service').credentials, req.user.customModel);
  res.render('pages/lm-status', {
    title: 'Custom Language model',
    status: rev[1]
  })
}

async function listWords(req: Request, res: Response) {
  let rev = await util.listWords(req.app.get('stt_service').credentials, req.user.customModel);
  res.render('pages/list-words', {
    words: (rev[1] ? rev[1].words : []),
    error: rev[0],
  });
}

async function postWord(req: Request, res: Response) {
  let id = await util.getCustomModelId(req.app.get('stt_service').credentials, req.user.customModel);
  let rev = await util.addWord(req.app.get('stt_service').credentials, id[1], req.body.word, req.body.soundslike, req.body.display )
  if (rev) {
    res.send(rev);
  } else {
    req.query.word = req.body.word;
    getWord(req, res);
  }
}

export { getSTT, postSTT, uploadWav, getCorpus, postCorpus,
  getCorpusStatus, postTrain,  getLMStatus, listWords, postWord};
