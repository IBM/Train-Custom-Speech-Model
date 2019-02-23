'use strict';

import { Request } from 'express';
import * as cfenv from 'cfenv';
import * as path from 'path';
import SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');

interface CfenvOpt {
  vcapFile?: any
}

export interface User {
  username: string;
  langModel: string;
  acousticModel: string;
}

export function getCfenv () {
  let cfenvOpt: CfenvOpt = {};

  // For local development
  if (!process.env.VCAP_APPLICATION) {
    cfenvOpt.vcapFile = path.join(__dirname, '..', 'services.json');
  }

  return cfenv.getAppEnv(cfenvOpt)
    .getService(process.env.STT_SERVICE_NAME || 'code-pattern-custom-language-model');
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

  private constructor(speech: SpeechToTextV1, username: string,
                      langModelName: string, langModelId: string,
                      acousticModelName: string, acousticModelId: string) {
    this.speech = speech;
    this.username = username;
    this.langModelName = langModelName;
    this.langModelId = langModelId;
    this.acousticModelName = acousticModelName;
    this.acousticModelId = acousticModelId;
  }

  /**
   * Create a new instance of WatsonSTT or get it from user session.
   * @param req Request object from express middleware
   */
  static async getInstance(req: Request): Promise<WatsonSTT> {
    let rev: WatsonSTT = req.user._watsonSTT;
    if (rev && rev instanceof WatsonSTT) {
      return Promise.resolve(rev);
    }

    if (!req.app.get('stt_service') || !req.app.get('stt_service').credentials) {
      req.log.error('Can not get credentials for Watson service');
      return Promise.resolve(undefined);
    }

    let speech = getSTTV1(req.app.get('stt_service').credentials);
    let langModelId = await getCustomLangModelId(speech, req.user);

    if (langModelId[0]) {
      req.log.error(`Custom language model error: ${langModelId[0]}`);
      return Promise.resolve(undefined);
    }
    let acousticModelId = await getCustomAcousticModelId(speech, req.user);
    if (acousticModelId[0]) {
      req.log.error(`Custom acoustic model error: ${acousticModelId[0]}`);
      return Promise.resolve(undefined);
    }

    return Promise.resolve(
      new WatsonSTT(speech, req.user.username,
        req.user.langModel, langModelId[1],
        req.user.acousticModel, acousticModelId[1]));
    }

    async addCorpus(corpusName: string, corpus: string): Promise<any[]>  {

      var addCorpusParams = {
        customization_id: this.langModelId,
        corpus_file: Buffer.from(corpus),
        corpus_name: corpusName,
        allow_overwrite: true
      };

      return new Promise<any[]>( (resolve, reject) => {
        this.speech.addCorpus(addCorpusParams, function(error: any) {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      })
    }

    /**
     * Add the specified word into the custom language model
     * @param word new word
     * @param soundsLike sounds like string array
     * @param displayAs display as caption
     */
    async addWord(word: string, soundsLike?: string[], displayAs?: string )
        : Promise<any[]> {

      let addWordParams = {
        customization_id: this.langModelId,
        word: word,
        sounds_like: soundsLike,
        display_as: displayAs
      };
      return new Promise<any[]>((resolve, reject) => {
        this.speech.addWord(addWordParams, (error: any) => {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      });
    }

    /**
     * Get corpus information by the corpus name
     * @param corpusName corpus name
     */
    async getCorpus(corpusName: string): Promise<any[]> {
      var getCorpusParams = {
        customization_id: this.langModelId,
        corpus_name: corpusName
      };

      return new Promise<any[]>((resolve, reject) => {
        this.speech.getCorpus(getCorpusParams,
          (error: any, corpus: CorpusResult)=> {
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
    async deleteCorpus(corpusName: string): Promise<any[]> {
      var deleteCorpusParams = {
        customization_id: this.langModelId,
        corpus_name: corpusName
      };

      return new Promise<any[]>((resolve, reject) => {
        this.speech.deleteCorpus(deleteCorpusParams,
          (error: any, corpusName: string) => {
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
    async getCorpora(): Promise<any[]> {
      var getCorporaParams = {
        customization_id: this.langModelId,
      };

      return new Promise<any[]>((resolve, reject) => {
        this.speech.listCorpora(getCorporaParams,
          (error: any, corpora: any) => {
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
    async trainModel(): Promise<any>{
      return new Promise<any[]>((resolve, reject) => {
        this.speech.trainLanguageModel({customization_id: this.langModelId },
          (error) => {
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
    async getLanguageModel(): Promise<any[]> {
      return new Promise<any[]>( (resolve, reject) => {
        this.speech.getLanguageModel({customization_id: this.langModelId },
          (error: any, languageModel: any) => {
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
    async listWords(): Promise<any[]> {
      return new Promise<any[]>((resolve, reject) => {
        this.speech.listWords({customization_id: this.langModelId },
          (error: any, results: any) => {
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
    async deleteWord(word: string): Promise<any[]> {
      let deleteWordParams = {
        customization_id: this.langModelId,
        word_name: word
      };

      return new Promise<any[]>((resolve, reject) => {
        this.speech.deleteWord(deleteWordParams, (error: any) => {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      });
    }

    /**
     * Get detailed information of the custom acoustic model
     */
    async getAcousticModel(): Promise<any[]> {
      return new Promise<any[]>( (resolve, reject) => {
        this.speech.getAcousticModel({customization_id: this.acousticModelId },
          (error: any, acousticModel: any) => {
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
    async trainAcousticModel(): Promise<any>{
      let trainAcousticModelParams = {
        customization_id: this.acousticModelId,
        custom_language_model_id: this.langModelId
      };
      return new Promise<any>((resolve, reject) => {
        this.speech.trainAcousticModel(trainAcousticModelParams, (error) => {
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
    async addAudio(params: any): Promise<any[]> {
      return new Promise<any[]>( (resolve, reject) => {
        this.speech.addAudio(params, (error: any) => {
          if (error) {
            resolve([error]);
          } else {
            resolve([undefined]);
          }
        });
      })
    }

    /**
     * List the audio of the custom acoustic model
     */
    async listAudio(): Promise<any[]> {
      let listAudioParams = {
        customization_id: this.acousticModelId,
      };

      return new Promise<any[]>((resolve, reject) => {
        this.speech.listAudio(listAudioParams,
          (error: any, audioResources: any) => {
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
    async deleteAudio(audioName: string): Promise<any[]> {
      let deleteAudioParams = {
        customization_id: this.acousticModelId,
        audio_name: audioName
      };
      return new Promise<any[]>((resolve, reject) => {
        this.speech.deleteAudio(deleteAudioParams,
          (error: any, audioName: string) => {
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
  let options: any = Object.create(credentials);
  if ((<STTCredentialAPIKey>credentials).apikey) {
    options.iam_apikey = (<STTCredentialAPIKey>credentials).apikey;
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
  id: string
}

// custom language model cache
let models: CustomModel[] = [];
// custom acoustic model cache
let acoustics: CustomModel[] = [];

/**
 * Get or create the custom model that belongs to the current
 * user and return the model id.
 * @param req The Request object of the express middleware
 */
function getCustomLangModelId(speech: SpeechToTextV1, user: any): Promise<any[]> {
  let modelName = user.langModel;

  for (let index = 0, len = models.length; index < len; index++) {
    if (models[index].name === modelName) {
      return Promise.resolve([undefined, models[index].id]);
    }
  }

  return new Promise((resolve) => {
    speech.listLanguageModels(null, (error: any, languageModels: any) => {
      if (error) {
        return resolve([error]);
      } else {
        let customModels = languageModels.customizations;
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
      speech.createLanguageModel(
        {
          name: modelName,
          base_model_name: 'en-US_NarrowbandModel',
          description: `Custom model for ${user.username}`,
        },
        (error: any, languageModel: any) => {
          if (error) {
            return resolve([error]);
          } else {
            models.push({name: modelName, id: languageModel.customization_id});
            return resolve([undefined, languageModel.customization_id]);
          }
      });
    });
  });
}

function getCustomAcousticModelId(speech: SpeechToTextV1, user: any): Promise<any[]> {
  let modelName = user.acousticModel;
  for (let index = 0, len = acoustics.length; index < len; index++) {
    if (acoustics[index].name === modelName) {
      return Promise.resolve([undefined, acoustics[index].id]);
    }
  }

  return new Promise((resolve) => {
    speech.listAcousticModels(null, (error: any, acousticModels: any) => {
      if (error) {
        return resolve([error]);
      } else {
        let customModels: Array<any> = acousticModels.customizations;
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
      speech.createAcousticModel(
        {
          name: modelName,
          base_model_name: 'en-US_NarrowbandModel',
          description: `Custom acoustic model for ${user.username}`,
        },
        (error: any, acousticModel: any) => {
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

export interface CorpusResult {
  name: string;
  out_of_vocabulary_words: number;
  total_words: number;
  status: string;
}
