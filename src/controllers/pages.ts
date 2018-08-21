'use strict';

import * as util from '../util';
import * as multer from 'multer';
import * as stream from 'stream';
import { Request, Response, RequestHandler } from 'express';

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
  word_alternatives_threshold: number;
  model: string;
  customized_id?: string;
}

/**
 * POST /stt
 */
function postSTT (req: Request, res: Response) {
  let speechToText = util.getSTTV1(req);
  let bufferStream = new stream.PassThrough();
  bufferStream.end( req.file.buffer );
  let recognizeParams: RecognizeParams = {
    audio: bufferStream,
    content_type: 'audio/wav',
    word_alternatives_threshold: 0.9,
    model: 'en-US_BroadbandModel',
  };

  if (req.body.model !== 'US_BroadbandModel') {
    recognizeParams.customized_id = req.body.model;
  }

  speechToText.recognize(recognizeParams, (error: any, results: any) => {
    if (error) {
      console.error(error);
      res.send(error);
    } else {
      let index = results['result_index'] || 0;
      let result = results.results[index];
      if (!result) {
        res.send('no result!');
      } else {
        res.send(result.alternatives[0].transcript);
      }
    }
  });
};


export { getSTT, postSTT, uploadWav };
