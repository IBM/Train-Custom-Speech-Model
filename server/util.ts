'use strict';

import { Request } from 'express';
import * as cfenv from 'cfenv';
import * as fs from 'fs';
import * as path from 'path';
import SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
import * as STTDef from 'ibm-watson/speech-to-text/v1-generated';
import * as WebSocket from 'ws';

/**
 * Need the final property in SpeechToTextV1.SpeechRecognitionResult
 */
interface STTStreamResult {
  final?: boolean;
}

interface CfenvOpt {
  vcapFile?: string;
}

export interface User {
  username: string;
  langModel: string;
  acousticModel: string;
  baseModel: string;
}

export function getCfenv () {
  const cfenvOpt: CfenvOpt = {};
  const serviceName = process.env.STT_SERVICE_NAME ||
    'code-pattern-custom-language-model';

  const service = cfenv.getAppEnv(cfenvOpt).getService(serviceName);

  // If service was not found, fall back to services.json if it exists.
  const servicesFile = path.join(__dirname, '..', 'services.json');
  if (!service && fs.existsSync(servicesFile)) {
    const creds = require(servicesFile);
    return creds.services[serviceName][0];
  }
  // Just return the service.
  else {
    return service;
  }

}

export interface STTError {
  code?: string;
  error?: string;
  msg?: string;
}

interface RecognizeParams {
  objectMode?: boolean;
  interim_results?: boolean;
  content_type: string;
  model: string;
  language_customization_id?: string;
  acoustic_customization_id?: string;
  smart_formatting?: boolean;
  redaction?: boolean;
  word_alternatives_threshold?: number;
  timestamps?: boolean;
}
/**
 * A class that wraps Watson STTV1 api and mainly focus on custom
 * language/acoustic model management.
 */
export class WatsonSTT {
  readonly speech: SpeechToTextV1;
  readonly username: string;
  readonly langModelName: string;
  readonly langModelId: string;
  readonly acousticModelName: string;
  readonly acousticModelId: string;
  readonly baseModel: string;
  readonly speechModels: STTDef.SpeechModels;

  private constructor(speech: SpeechToTextV1, username: string,
                      langModelName: string, langModelId: string,
                      acousticModelName: string, acousticModelId: string,
                      baseModel: string, speechModels: STTDef.SpeechModels) {
    this.speech = speech;
    this.username = username;
    this.langModelName = langModelName;
    this.langModelId = langModelId;
    this.acousticModelName = acousticModelName;
    this.acousticModelId = acousticModelId;
    this.baseModel = baseModel;
    this.speechModels = speechModels;

  }

  /**
   * Create a new instance of WatsonSTT or get it from user session.
   * @param req Request object from express middleware
   */
  static async getInstance(req: Request): Promise<WatsonSTT> {
    const rev: WatsonSTT = req.user._watsonSTT;
    if (rev && rev instanceof WatsonSTT) {
      return Promise.resolve(rev);
    }
    if (!req.app.get('stt_service') ||
        !req.app.get('stt_service').credentials) {
      req.log.error('Can not get credentials for Watson service');
      return Promise.resolve(undefined);
    }

    const speech = getSTTV1(req.app.get('stt_service').credentials);
    const langModelId = await getCustomLangModelId(speech, req.user);
    const speechModels = await getBaseModels(speech);
    if (langModelId[0]) {
      req.log.error(`Custom language model error: ${langModelId[0]}`);
      return Promise.resolve(undefined);
    }
    const acousticModelId = await getCustomAcousticModelId(speech, req.user);
    if (acousticModelId[0]) {
      req.log.error(`Custom acoustic model error: ${acousticModelId[0]}`);
      return Promise.resolve(undefined);
    }

    return Promise.resolve(
      new WatsonSTT(speech, req.user.username,
        req.user.langModel, langModelId[1],
        req.user.acousticModel, acousticModelId[1],
        req.user.baseModel, speechModels[1]));
    }

    async addCorpus(corpusName: string, corpus: string): Promise<[STTError]>  {

      const addCorpusParams = {
        customization_id: this.langModelId,
        corpus_file: Buffer.from(corpus),
        corpus_name: corpusName,
        allow_overwrite: true
      };

      return new Promise<[STTError]>( (resolve, reject) => {
        this.speech.addCorpus(addCorpusParams, (error: STTError) => {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      });
    }

    /**
     * Add the specified word into the custom language model
     * @param word new word
     * @param soundsLike sounds like string array
     * @param displayAs display as caption
     */
    async addWord(word: string, soundsLike?: string[], displayAs?: string )
        : Promise<[STTError]> {

      const addWordParams = {
        customization_id: this.langModelId,
        word_name: word,
        word,
        sounds_like: soundsLike,
        display_as: displayAs
      };
      return new Promise<[STTError]>((resolve, reject) => {
        this.speech.addWord(addWordParams, (error: STTError) => {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      });
    }

    async transcribe(buff: Buffer, fileType: string, name: string,
        languageModel: string, acousticModel: string ):
        Promise<[STTError, number?]> {
      const recognizeParams: RecognizeParams = {
        objectMode: true,
        interim_results: true,
        content_type: `audio/${fileType}`,
        model: this.baseModel,
        smart_formatting: true,
        timestamps: true,
        word_alternatives_threshold: 0.9
      };

      const langModelisBaseModel = this.isBaseModel(languageModel);
      const acousticModelisBaseModel = this.isBaseModel(acousticModel);

      // Enable client to pass in base model.
      if (langModelisBaseModel){
        recognizeParams.model = languageModel;
      }

      if (! langModelisBaseModel) {
        recognizeParams.language_customization_id = this.langModelId;
      }

      if (! acousticModelisBaseModel) {
        recognizeParams.acoustic_customization_id = this.acousticModelId;
      }

      const tf: TranscribeFile = {
        tid: tid++,
        name,
        languageModel,
        acousticModel,
        ws: null
      };
      // add TranscribeFile to queue and wait for client's response
      // then a corresponding WebSocket will be added
      addQueue(tf);
      // Create the stream.
      const sstream = this.speech.recognizeUsingWebSocket(recognizeParams);
      sstream.on('data', (event: STTDef.SpeechRecognitionResults) => {
        if(event.results[0] && tf.ws &&
          (event.results[0] as STTStreamResult).final === true) {

          const result = event.results[0].alternatives[0];
          const timestamps = result.timestamps;
          tf.ws.send(JSON.stringify(
            { transcript: result.transcript.trim(),
              start: timestamps[0][1],
              stop: timestamps[timestamps.length - 1][2]
            }));
        }
      });
      sstream.on('error', (event) => {
        if(tf.ws) {
          tf.ws.send(JSON.stringify({error: event.message}));
        }
        delQueue(tf);
      });
      sstream.on('close', () => {
        if (tf.ws) {
          tf.ws.send(JSON.stringify({finished: true}));
        }
        delQueue(tf);
      });

      return new Promise<[STTError, number?]>( (resolve, reject) => {
        let cursor = 0;
        const threeMB = 1024 * 1024 * 3;
        while (true) {
          let end = cursor + threeMB;
          if (end > buff.byteLength) {
            end = buff.byteLength;
            sstream.end(buff.slice(cursor, end), () => {
              resolve([undefined, tf.tid]);
            });
            break;
          }
          sstream.write(buff.slice(cursor, end));
          cursor += threeMB;
        }
      });
    }
    /**
     * Get corpus information by the corpus name
     * @param corpusName corpus name
     */
    async getCorpus(corpusName: string): Promise<[STTError, STTDef.Corpus?]> {
      const getCorpusParams = {
        customization_id: this.langModelId,
        corpus_name: corpusName
      };

      return new Promise<[STTError, STTDef.Corpus?]>((resolve, reject) => {
        this.speech.getCorpus(getCorpusParams,
          (error: STTError, corpus: STTDef.Corpus)=> {
            if (error) {
              resolve([error]);
            } else {
              resolve([undefined, corpus]);
            }
        });
      });
    }

    /**
     * Delete a corpus by the corpus name
     * @param corpusName corpus name
     */
    async deleteCorpus(corpusName: string): Promise<[STTError, string?]> {
      const deleteCorpusParams = {
        customization_id: this.langModelId,
        corpus_name: corpusName
      };

      return new Promise<[STTError, string?]>((resolve, reject) => {
        this.speech.deleteCorpus(deleteCorpusParams,
          (error: STTError, corpusName: string) => {
            if (error) {
              resolve([error]);
            } else {
              resolve([undefined, corpusName]);
            }
        });
      });
    }

    /**
     * Get Corpora information of the custom language model
     */
    async getCorpora(): Promise<[STTError, STTDef.Corpora?]> {
      const getCorporaParams = {
        customization_id: this.langModelId,
      };

      return new Promise<[STTError, STTDef.Corpora?]>((resolve, reject) => {
        this.speech.listCorpora(getCorporaParams,
          (error: STTError, corpora: STTDef.Corpora) => {
            if (error) {
              resolve([error]);
            } else {
              resolve([undefined, corpora]);
            }
        });
      });
    }

    /**
     * Kick of the custom language model train
     */
    async trainModel(): Promise<[STTError]>{
      return new Promise<[STTError]>((resolve, reject) => {
        this.speech.trainLanguageModel({customization_id: this.langModelId },
          (error: STTError) => {
            if (error) {
              resolve([error]);
            } else {
              resolve([undefined]);
            }
        });
      });
    }

    /**
     * Get detailed information of the custom language model
     */
    async getLanguageModel(): Promise<[STTError, STTDef.LanguageModel?]> {
      return new Promise<[STTError, STTDef.LanguageModel?]>(
        (resolve, reject) => {
          this.speech.getLanguageModel({customization_id: this.langModelId },
            (error: STTError, languageModel: STTDef.LanguageModel) => {
              if (error) {
                resolve([error]);
              } else {
                resolve([undefined, languageModel]);
              }
          });
      });
    }

    /**
     * List words of the custom language model
     */
    async listWords(): Promise<[STTError, STTDef.Words?]> {
      return new Promise<[STTError, STTDef.Words?]>((resolve, reject) => {
        this.speech.listWords({customization_id: this.langModelId },
          (error: STTError, results: STTDef.Words) => {
            if (error) {
              resolve([error]);
            } else {
              resolve([undefined, results]);
            }
        });
      });
    }

    /**
     * Delete a specific word from the custom language model
     * @param word word
     */
    async deleteWord(word: string): Promise<[STTError]> {
      const deleteWordParams = {
        customization_id: this.langModelId,
        word_name: word
      };

      return new Promise<[STTError]>((resolve, reject) => {
        this.speech.deleteWord(deleteWordParams, (error: STTError) => {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      });
    }

    /**
     * Check a model name is one of the base models
     *
     * @param model model name
     */
    isBaseModel(model: string): boolean {
      let found = false;
      if (this.speechModels.models.find((element): boolean => {
        return element.name === model;
      })){
        return found = true;
      }
      return found;
    }

    /**
     * Get detailed information of the custom acoustic model
     */
    async getAcousticModel(): Promise<[STTError, STTDef.AcousticModel?]> {
      return new Promise<[STTError, STTDef.AcousticModel?]>(
        (resolve, reject) => {
          this.speech.getAcousticModel(
            {customization_id: this.acousticModelId },
            (error: STTError, acousticModel: STTDef.AcousticModel) => {
              if (error) {
                resolve([error]);
              } else {
                resolve([undefined, acousticModel]);
              }
          });
      });
    }

    /**
     * Kick of the custom acoustic model training process
     */
    async trainAcousticModel(): Promise<[STTError]>{
      const trainAcousticModelParams = {
        customization_id: this.acousticModelId,
        custom_language_model_id: this.langModelId
      };
      return new Promise<[STTError]>((resolve, reject) => {
        this.speech.trainAcousticModel(trainAcousticModelParams,
          (error: STTError) => {
            if (error) {
              resolve([error]);
            } else {
              resolve([undefined]);
            }
        });
      });
    }

    /**
     * Add audio to custom acoustic model
     * @param params
     */
    async addAudio(params: STTDef.AddAudioParams): Promise<[STTError]> {
      return new Promise<[STTError]>( (resolve, reject) => {
        this.speech.addAudio(params, (error: STTError) => {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      });
    }

    /**
     * List the audio of the custom acoustic model
     */
    async listAudio(): Promise<[STTError, STTDef.AudioResources?]> {
      const listAudioParams = {
        customization_id: this.acousticModelId,
      };

      return new Promise<[STTError, STTDef.AudioResources?]>(
        (resolve, reject) => {
          this.speech.listAudio(listAudioParams,
            (error: STTError, audioResources: STTDef.AudioResources) => {
              if (error) {
                resolve([error]);
              } else {
                resolve([undefined, audioResources]);
              }
          });
      });
    }

    /**
     * Delete a specific audio from the custom acoustic model
     * @param audioName name of the audio
     */
    async deleteAudio(audioName: string): Promise<[STTError, string?]> {
      const deleteAudioParams = {
        customization_id: this.acousticModelId,
        audio_name: audioName
      };
      return new Promise<[STTError, string?]>((resolve, reject) => {
        this.speech.deleteAudio(deleteAudioParams,
          (error: STTError, audioName: string) => {
            if (error) {
              resolve([error]);
            } else {
              resolve([undefined, audioName]);
            }
        });
      });
    }
}

export function getSTTV1 (credentials: STTCredential) {
  const options: STTDef.Options = Object.create(credentials);
  if ((credentials as STTCredentialAPIKey).apikey) {
    options.iam_apikey = (credentials as STTCredentialAPIKey).apikey;
  }
  return new SpeechToTextV1(options);
}

export type STTCredential = STTCredentialUserPass | STTCredentialAPIKey;

/**
 * If the service is not using IAM yet, the credential would
 * be username and password.
 */
export interface STTCredentialUserPass {
  username: string;
  password: string;
  url: string;
}

/**
 * If the service is using IAM, the credential would be
 * api key.
 */
export interface STTCredentialAPIKey {
  apikey: string;
  url: string;
}

interface CustomModel {
  name: string;
  id: string;
}

// custom language model cache
const models: CustomModel[] = [];
// custom acoustic model cache
const acoustics: CustomModel[] = [];

/**
 * Get or create the custom model that belongs to the current
 * user and return the model id.
 * @param req The Request object of the express middleware
 */
function getCustomLangModelId(
    speech: SpeechToTextV1, user: User): Promise<[STTError, string?]> {
  const modelName = user.langModel;

  for (let index = 0, len = models.length; index < len; index++) {
    if (models[index].name === modelName) {
      return Promise.resolve<[STTError, string?]>(
        [undefined, models[index].id]);
    }
  }

  return new Promise<[STTError, string?]>((resolve) => {
    speech.listLanguageModels(null,
      (error: STTError, languageModels: STTDef.LanguageModels) => {
        if (error) {
          return resolve([error]);
        } else {
          const customModels = languageModels.customizations;
          if (customModels) {
            for (let i = 0, len = customModels.length; i < len; i++) {
              if (customModels[i].name === modelName) {
                models.push(
                  {
                    name: modelName,
                    id: customModels[i].customization_id
                  });
                return resolve([undefined, customModels[i].customization_id]);
              }
            }
          }
        }
        // Need to create custom model here.
        // The default base model for which the initial creation of
        // custom language model is based on is configurable in model/user.json
        speech.createLanguageModel(
          {
            name: modelName,
            base_model_name: user.baseModel,
            description: `Custom model for ${user.username}`,
          },
          (error: STTError, languageModel: STTDef.LanguageModel) => {
            if (error) {
              return resolve([error]);
            } else {
              models.push(
                {name: modelName, id: languageModel.customization_id});
              return resolve([undefined, languageModel.customization_id]);
            }
        });
    });
  });
}
/**
 * Get the list of  supported base models
 * @param speech SpeechtoTextV1
 */
function getBaseModels(speech: SpeechToTextV1):
  Promise<[STTError,STTDef.SpeechModels?]>{
    return new Promise<[STTError, STTDef.SpeechModels?]>(
      (resolve, reject) => {
        speech.listModels(null,
        (error: STTError, results: STTDef.SpeechModels) => {
        if (error) {
          resolve([error]);
        } else {
          resolve([undefined, results]);
        }
        });
    });
}

function getCustomAcousticModelId(
    speech: SpeechToTextV1, user: User): Promise<[STTError, string?]> {
  const modelName = user.acousticModel;
  for (let index = 0, len = acoustics.length; index < len; index++) {
    if (acoustics[index].name === modelName) {
      return Promise.resolve<[STTError, string?]>(
        [undefined, acoustics[index].id]);
    }
  }

  return new Promise<[STTError, string?]>((resolve) => {
    speech.listAcousticModels(null,
      (error: STTError, acousticModels: STTDef.AcousticModels) => {
        if (error) {
          return resolve([error]);
        } else {
          const customModels: STTDef.AcousticModel[] =
            acousticModels.customizations;
          if (customModels) {
            for (let i = 0, len = customModels.length; i < len; i++) {
              if (customModels[i].name === modelName) {
                acoustics.push(
                  {
                    name: modelName,
                    id: customModels[i].customization_id
                  });
                return resolve([undefined, customModels[i].customization_id]);
              }
            }
          }
        }
        // Create custom acoustic model here if it doesn't exist.
        // The default base model for which the initial creation of
        // custom acoustic model is based on is configurable in model/user.json
        speech.createAcousticModel(
          {
            name: modelName,
            base_model_name: user.baseModel,
            description: `Custom acoustic model for ${user.username}`,
          },
          (error: STTError, acousticModel: STTDef.AcousticModel) => {
            if (error) {
              return resolve([error]);
            } else {
              acoustics.push(
                {
                  name: modelName,
                  id: acousticModel.customization_id
                });
              return resolve([undefined, acousticModel.customization_id]);
            }
        });
    });
  });
}

const queue: Queue<TranscribeFile> = {};
let tid = 0;
interface Queue<T> {
  [tid:string]: T;
}

interface TranscribeFile {
  tid: number;
  name:string;
  languageModel: string;
  acousticModel: string;
  ws: WebSocket;
}

const addQueue = (tf: TranscribeFile) => {
  queue[tf.tid] = tf;
};

const delQueue = (tf: TranscribeFile) => {
  delete queue[tf.tid];
};

export let wsHandler = (socket: WebSocket): void => {
  socket.on('message', (message) => {
    if (typeof(message) === 'string') {
      const json: TranscribeFile = JSON.parse(message as string);
      const tf = queue[json.tid];
      if (tf) {
        tf.ws = socket;
        tf.ws.onclose = tf.ws.onerror = () => {
          tf.ws = null;
        };
      }
    }
  });
};
