'use strict';

import * as multer from 'multer';
import * as stream from 'stream';
import {WatsonSTT} from '../util';
import { Request, Response, RequestHandler } from 'express';
import { NextFunction } from 'connect';
import * as STTDef from 'watson-developer-cloud/speech-to-text/v1-generated';

declare global {
  namespace Express {
    interface Request {
      // Let's attach session scoped WatsonSTT
      // to Request directly
      watsonSTT?: WatsonSTT;
      log?: Console;
    }
  }
}

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Handle the audio file upload.
 */
const uploadAudio: RequestHandler = upload.single('audio');

interface RecognizeParams {
  audio: stream.Readable;
  content_type: string;
  model: string;
  language_customization_id?: string;
  acoustic_customization_id?: string;
}

/**
 * POST /api/transcribe
 */
async function postTranscribe (req: Request, res: Response) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end( req.file.buffer );
  const type = req.file.originalname.split('.').pop();

  const recognizeParams: RecognizeParams = {
    audio: bufferStream,
    content_type: `audio/${type}`,
    model: 'en-US_NarrowbandModel'
  };

  const watsonSTT: WatsonSTT = req.watsonSTT;

  if (req.body.languageModel !== 'en-US_NarrowbandModel') {
    recognizeParams.language_customization_id = watsonSTT.langModelId;
  }

  if (req.body.acousticModel !== 'en-US_NarrowbandModel') {
    recognizeParams.acoustic_customization_id = watsonSTT.acousticModelId;
  }

  watsonSTT.speech.recognize(recognizeParams,
    (error: string, results: STTDef.SpeechRecognitionResults) => {
      if (error || !results.results[0]) {
        return res.status(500).json({
          error: error || results.results[0]
        });
      }
      else {
        const transcript = results.results.map(
          (result:STTDef.SpeechRecognitionResult) => {
            return result.alternatives[0].transcript;
        });
        return res.status(200).json({
          transcription: transcript.join('')
        });
      }
  });
  return;
}

async function getModel(req: Request, res: Response) {
  const result = await req.watsonSTT.getLanguageModel();
  if (result[0]) {
    return res.status(500).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      data: result[1]
    });
  }
}

async function getAcousticModel(req: Request, res: Response) {
  const result = await req.watsonSTT.getAcousticModel();
  if (result[0]) {
    return res.status(500).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      data: result[1]
    });
  }
}

async function postAudio(req: Request, res: Response) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end( req.file.buffer );

  const type = req.file.originalname.split('.').pop();
  let contentType;
  if (type === 'zip') {
    contentType = 'application/zip';
  }
  else if (['tgz', 'gz'].indexOf(type) >= 0) {
    contentType = 'application/gzip';
  }
  // Else assume it is audio type.
  else {
    contentType = 'audio/' + type;
  }

  const params = {
    customization_id: req.watsonSTT.acousticModelId,
    content_type: contentType,
    audio_resource: bufferStream,
    audio_name: req.body.audioName
  };
  const result = await req.watsonSTT.addAudio(params);

  if (result[0]) {
    return res.status(500).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      status: 'added'
    });
  }
}

async function listAudio(req: Request, res: Response) {
  const audioResources = await req.watsonSTT.listAudio();
  if (audioResources[0]) {
    return res.status(500).json({
      error: audioResources[0]
    });
  } else {
    return res.status(200).json({
      audio: audioResources[1].audio
    });
  }
}

async function deleteAudio(req: Request, res: Response) {
  if (req.params.name) {
    const result = await req.watsonSTT.deleteAudio(req.params.name);
    if (result[0]) {
      return res.status(500).json({
        error: result[0]
      });
    } else {
      return res.status(200).json({
        audioName: result[1],
        status: 'deleted'
      });
    }
  } else {
    return res.status(400).json({
      error: 'No audio name specified.'
    });
  }
}

async function postCorpus(req: Request, res: Response) {
  const result = await req.watsonSTT.addCorpus(
    req.body.corpusName,
    req.body.corpus);

  if (result[0]) {
    return res.status(500).json({
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
    const result = await req.watsonSTT.deleteCorpus(req.params.name);
    if (result[0]) {
      return res.status(500).json({
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
  const corpora = await req.watsonSTT.getCorpora();
  if (corpora[0]) {
    return res.status(500).json({
      error: corpora[0]
    });
  } else {
    return res.status(200).json({
      corpora: corpora[1].corpora
    });
  }
}

async function getWords(req: Request, res: Response) {
  const words = await req.watsonSTT.listWords();
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
  const result = await req.watsonSTT.addWord(
    req.body.word, req.body.sounds_like, req.body.display_as
  );
  if (result[0]) {
    return res.status(500).json({
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
    const result = await req.watsonSTT.deleteWord(req.params.name);
    if (result[0]) {
      return res.status(500).json({
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
  const result = await req.watsonSTT.trainModel();
  if (result[0]) {
    return res.status(500).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      status: 'started'
    });
  }
}

async function trainAcousticModel(req: Request, res: Response) {
  // Get the customization ID of the custom language model to pass in for
  // training.
  const result = await req.watsonSTT.trainAcousticModel();
  if (result[0]) {
    return res.status(500).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      status: 'started'
    });
  }
}

async function checkWatsonCredential(
    req: Request, res: Response, next: NextFunction) {
  const watsonSTT: WatsonSTT = await WatsonSTT.getInstance(req);
  if (watsonSTT === undefined) {
    req.log.error('Can not connect to Watson service');
    next({
      error: 'Can not connect to Watson service, please check server logs'});
  }
  req.watsonSTT = watsonSTT;
  next();
}
export {
  uploadAudio, postTranscribe, getModel, getAcousticModel, deleteCorpus,
  postCorpus, postAudio, listAudio, deleteAudio, getCorpora, getWords,
  addWord, deleteWord, trainModel, trainAcousticModel, checkWatsonCredential
};
