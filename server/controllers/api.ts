'use strict';

import * as multer from 'multer';
import * as stream from 'stream';
import * as util from '../util';
import { Request, Response, RequestHandler } from 'express';

let upload = multer({ storage: multer.memoryStorage() });

/**
 * Handle the audio file upload.
 */
let uploadAudio: RequestHandler = upload.single('audio');

interface RecognizeParams {
  audio: stream.Readable;
  content_type: string;
  model: string;
  customization_id?: string;
}

/**
 * POST /api/transcribe
 */
async function postTranscribe (req: Request, res: Response) {
  let speechToText = util.getSTTV1(req.app.get('stt_service').credentials);
  let bufferStream = new stream.PassThrough();
  bufferStream.end( req.file.buffer );
  let types = ['wav', 'mp3', 'flac'];
  let type = req.file.originalname.split('.').pop();
  if (types.indexOf(type) == -1) {
    return res.status(400).json({
      error: `File extension must be one of: ${types.join(',')}`
    });
  }

  let recognizeParams: RecognizeParams = {
    audio: bufferStream,
    content_type: `audio/${type}`,
    model: 'en-US_BroadbandModel'
  };

  let id = await util.getCustomModelId(req);
  if (req.body.model !== 'en-US_BroadbandModel') {
    recognizeParams.customization_id = id[1];
    delete recognizeParams.model;
  }

  speechToText.recognize(recognizeParams, (error: any, results: any) => {
    if (error || !results.results[0]) {
      return res.status(500).json({
        error: error || results.results[0]
      });
    }
    else {
      let transcript = results.results.map( (result:any) => {
        return result.alternatives[0].transcript;
      });
      return res.status(200).json({
        transcription: transcript.join('')
      });
    }
  });
  return null;
};

async function getModel(req: Request, res: Response) {
  let id = await util.getCustomModelId(req);
  let result = await util.getLanguageModel(req.app.get('stt_service').credentials, id[1]);
  if (result[0]) {
    return res.status(result[0].code).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      data: result[1]
    });
  }
}

async function postCorpus(req: Request, res: Response) {
  let id = await util.getCustomModelId(req);
  let result = await util.addCorpus(req.app.get('stt_service').credentials, id[1], req.body.corpusName, req.body.corpus);

  if (result[0]) {
    return res.status(result[0].code).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      status: 'added'
    });
  }
}

async function deleteCorpus(req: Request, res: Response) {
  if (req.params.name) {
    let id = await util.getCustomModelId(req);
    let result = await util.deleteCorpus(req.app.get('stt_service').credentials, id[1], req.params.name);
    if (result[0]) {
      return res.status(result[0].code).json({
        error: result[0]
      });
    } else {
      return res.status(200).json({
        corpusName: result[1],
        status: 'deleted'
      });
    }
  } else {
    return res.status(400).json({
      error: 'No corpus name specified.'
    });
  }
}

async function getCorpora(req: Request, res: Response) {
  let id = await util.getCustomModelId(req);
  let corpora = await util.getCorpora(req.app.get('stt_service').credentials, id[1]);
  if (corpora[0]) {
    return res.status(corpora[0].code).json({
      error: corpora[0]
    });
  } else {
    return res.status(200).json({
      corpora: corpora[1].corpora
    });
  }
}

async function getWords(req: Request, res: Response) {
  let id = await util.getCustomModelId(req);
  let words = await util.listWords(req.app.get('stt_service').credentials, id[1]);
  if (words[0]) {
    return res.status(500).json({
      error: words[0]
    });
  } else {
    return res.status(200).json({
      words: words[1].words
    });
  }
}

async function addWord(req: Request, res: Response) {
  let id = await util.getCustomModelId(req);
  let result = await util.addWord(
    req.app.get('stt_service').credentials, id[1], req.body.word,
    req.body.sounds_like, req.body.display_as
  );
  if (result[0]) {
    return res.status(result[0].code).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      word: req.body.word,
      status: 'added'
    });
  }
}

async function deleteWord(req: Request, res: Response) {
  if (req.params.name) {
    let id = await util.getCustomModelId(req);
    let result = await util.deleteWord(req.app.get('stt_service').credentials, id[1], req.params.name);
    if (result[0]) {
      return res.status(result[0].code).json({
        error: result[0]
      });
    } else {
      return res.status(200).json({
        word: req.params.name,
        status: 'deleted'
      });
    }
  } else {
    return res.status(400).json({
      error: 'No word name specified.'
    });
  }
}

async function trainModel(req: Request, res: Response) {
  let id = await util.getCustomModelId(req);
  let result = await util.trainModel(req.app.get('stt_service').credentials, id[1]);
  if (result[0]) {
    return res.status(result[0].code).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      status: 'started'
    });
  }
}

export { uploadAudio, postTranscribe, getModel, deleteCorpus, postCorpus, getCorpora, getWords,
  addWord, deleteWord, trainModel };
