'use strict';

import { Request } from 'express';
import * as cfenv from 'cfenv';
import * as path from 'path';
import SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
import * as STTDef from 'watson-developer-cloud/speech-to-text/v1-generated';

interface CfenvOpt {
  vcapFile?: string;
}

export interface User {
  username: string;
  langModel: string;
  acousticModel: string;
}

export function getCfenv () {
  const cfenvOpt: CfenvOpt = {};

  // For local development
  if (!process.env.VCAP_APPLICATION) {
    cfenvOpt.vcapFile = path.join(__dirname, '..', 'services.json');
  }

  return cfenv.getAppEnv(cfenvOpt)
    .getService(process.env.STT_SERVICE_NAME ||
      'code-pattern-custom-language-model');
}

export interface STTError {
  code?: string;
  error?: string;
  msg?: string;
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
        req.user.acousticModel, acousticModelId[1]));
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
        speech.createLanguageModel(
          {
            name: modelName,
            base_model_name: 'en-US_NarrowbandModel',
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
        speech.createAcousticModel(
          {
            name: modelName,
            base_model_name: 'en-US_NarrowbandModel',
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
