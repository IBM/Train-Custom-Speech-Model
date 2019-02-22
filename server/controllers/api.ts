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
  language_customization_id?: string;
  acoustic_customization_id?: string;
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
    model: 'en-US_NarrowbandModel'
  };

  let id = await util.getCustomModelId(req);
  if (req.body.languageModel !== 'en-US_NarrowbandModel') {
    recognizeParams.language_customization_id = id[1];
  }

  id = await util.getCustomAcousticModelId(req);
  if (req.body.acousticModel !== 'en-US_NarrowbandModel') {
    recognizeParams.acoustic_customization_id = id[1];
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

async function getAcousticModel(req: Request, res: Response) {
  let id = await util.getCustomAcousticModelId(req);
  let result = await util.getAcousticModel(req.app.get('stt_service').credentials, id[1]);
  if (result[0]) {
    return res.status(result[0].code || 500).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      data: result[1]
    });
  }
}

async function postAudio(req: Request, res: Response) {
  let bufferStream = new stream.PassThrough();
  bufferStream.end( req.file.buffer );

  let id = await util.getCustomAcousticModelId(req);
  let type = req.file.originalname.split('.').pop();

  let params = {
    customization_id: id[1],
    content_type: 'audio/' + type,
    audio_resource: bufferStream,
    audio_name: req.body.corpusName + '-audio'
  };

  let result = await util.addAudio(req.app.get('stt_service').credentials, params);

  if (result[0]) {
    return res.status(result[0].code || 500).json({
      error: result[0]
    });
  } else {
    return res.status(200).json({
      status: 'added'
    });
  }
}

async function listAudio(req: Request, res: Response) {
  let id = await util.getCustomAcousticModelId(req);
  let audioResources = await util.listAudio(req.app.get('stt_service').credentials, id[1]);
  if (audioResources[0]) {
    return res.status(audioResources[0].code || 500).json({
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
    let id = await util.getCustomAcousticModelId(req);
    let result = await util.deleteAudio(req.app.get('stt_service').credentials, id[1], req.params.name);
    if (result[0]) {
      return res.status(result[0].code || 500).json({
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

async function trainAcousticModel(req: Request, res: Response) {
  let id = await util.getCustomAcousticModelId(req);

  // Get the customization ID of the custom language model to pass in for training.
  let langId = await util.getCustomModelId(req);

  let result = await util.trainAcousticModel(req.app.get('stt_service').credentials, id[1], langId[1]);
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

export {
  uploadAudio, postTranscribe, getModel, getAcousticModel, deleteCorpus, postCorpus,
  postAudio, listAudio, deleteAudio, getCorpora, getWords,
  addWord, deleteWord, trainModel, trainAcousticModel
};
