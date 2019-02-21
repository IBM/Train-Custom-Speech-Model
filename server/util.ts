'use strict';

import * as fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import * as cfenv from 'cfenv';
import * as path from 'path';
import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');


interface CfenvOpt {
  vcapFile?: any
}

export interface User {
  username: string;
  customModel: string;
}

export function initPassport() {
  /*
  * Sign in using Username and Password.
  */

  let users = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'model', 'user.json')).toString());
  passport.serializeUser<any, any>((user: User, done) => {
    done(undefined, user.username);
  });

  passport.deserializeUser((username: string, done) => {
    done(undefined, {username: username, customModel: users[username].customModel});
  });

  passport.use(new LocalStrategy({ usernameField: 'username' }, (username: string, password: string, done: Function) => {
    if (users[username]) {
      if (users[username].password === password) {
        return done(undefined, {username: username, customModel: users[username].customModel});
      }
      return done(undefined, false, { message: 'Invalid username or password.' });
    } else {
      return done(undefined, false, { message: `user: ${username} doesn't exist` });
    }
  }));
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

let models: CustomModel[] = [];

/**
 * Get or create the custom model that belongs to the current
 * user and return the model id.
 * @param req The Request object of the express middleware
 */
export function getCustomModelId(req: Request): Promise<any[]> {
  let credentials = req.app.get('stt_service').credentials;
  let modelName = req.user.customModel;

  if (req.user.model_id) {
    return Promise.resolve([undefined, req.user.model_id]);
  }

  let speech = getSTTV1(credentials);
  for (let index = 0, len = models.length; index < len; index++) {
    if (models[index].name === modelName) {
      req.user.model_id =  models[index].id;
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
          for (let index = 0, len = customModels.length; index < len; index++) {
            if (customModels[index].name === modelName) {
              models.push({name: modelName, id: customModels[index].customization_id});
              req.user.model_id =  customModels[index].customization_id;
              return resolve([undefined, customModels[index].customization_id]);
            }
          }
        }
      }
      // Need to create custom model here
      speech.createLanguageModel(
        {
          name: modelName,
          base_model_name: 'en-US_BroadbandModel',
          description: `Custom model for ${req.user.username}`,
        }, function(error, languageModel) {
        if (error) {
          return resolve([error]);
        } else {
          models.push({name: modelName, id: languageModel.customization_id});
          req.user.model_id = languageModel.customization_id;
          return resolve([undefined, languageModel.customization_id]);
        }
      });
    });
  });
}

export function addCorpus(credentials: STTCredential, modelId: string, corpusName: string, corpus: string): Promise<any[]>  {
  let speech = getSTTV1(credentials);

  var addCorpusParams = {
    customization_id: modelId,
    corpus_file: Buffer.from(corpus),
    corpus_name: corpusName,
    allow_overwrite: true
  };

  return new Promise( (resolve, reject) => {
    speech.addCorpus(addCorpusParams, function(error: any) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined]);
      }
    });
  })
}

export function addWord(credentials: STTCredential, modelId: string, word: string,
  soundsLike?: string[], displayAs?: string ): Promise<any[]> {

  let speech = getSTTV1(credentials);
  let addWordParams = {
    customization_id: modelId,
    word: word,
    sounds_like: soundsLike,
    display_as: displayAs
  };
  return new Promise( (resolve, reject) => {
    speech.addWord(addWordParams, (error: any) => {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined]);
      }
    });
  });
}

export interface CorpusResult {
  name: string;
  out_of_vocabulary_words: number;
  total_words: number;
  status: string;
}

export function getCorpus(credentials: STTCredential, modelId: string, corpusName: string): Promise<any[]> {
  let speech = getSTTV1(credentials);
  var getCorpusParams = {
    customization_id: modelId,
    corpus_name: corpusName
  };

  return new Promise<any[]>((resolve, reject) => {
    speech.getCorpus(getCorpusParams, function(error: any, corpus: CorpusResult) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined, corpus]);
      }
    });
  });
}

export function deleteCorpus(credentials: STTCredential, modelId: string, corpusName: string): Promise<any[]> {
  let speech = getSTTV1(credentials);
  var deleteCorpusParams = {
    customization_id: modelId,
    corpus_name: corpusName
  };

  return new Promise<any[]>((resolve, reject) => {
    speech.deleteCorpus(deleteCorpusParams, function(error: any, corpusName: string) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined, corpusName]);
      }
    });
  });
}

export function getCorpora(credentials: STTCredential, modelId: string): Promise<any[]> {
  let speech = getSTTV1(credentials);
  var getCorporaParams = {
    customization_id: modelId,
  };

  return new Promise<any[]>((resolve, reject) => {
    speech.listCorpora(getCorporaParams, function(error: any, corpora: any) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined, corpora]);
      }
    });
  });
}

export async function trainModel(credentials: STTCredential, modelId: string): Promise<any>{
  let speech = getSTTV1(credentials);

  return new Promise<any>((resolve, reject) => {
    speech.trainLanguageModel({customization_id: modelId }, function(error) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined]);
      }
    });
  });
}

export async function getLanguageModel(credentials: STTCredential, modelId: string): Promise<any[]> {
  let speech = getSTTV1(credentials);
  return new Promise<any[]>( (resolve, reject) => {
    speech.getLanguageModel({customization_id: modelId }, function(error: any, languageModel: any) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined, languageModel]);
      }
    });
  });
}

export async function listWords(credentials: STTCredential, modelId: string): Promise<any[]> {
  let speech = getSTTV1(credentials);

  return new Promise<any[]>((resolve, reject) => {
    speech.listWords({customization_id: modelId }, function(error: any, results: any) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined, results]);
      }
    });
  });
}

export async function deleteWord(credentials: STTCredential, modelId: string, word: string): Promise<any[]> {
  let speech = getSTTV1(credentials);
  let deleteWordParams = {
    customization_id: modelId,
    word_name: word
  };

  return new Promise<any[]>((resolve, reject) => {
    speech.deleteWord(deleteWordParams, function(error: any) {
      if (error) {
        resolve([error]);
      } else {
        resolve([undefined]);
      }
    });
  });
}

/**
 * Login Required middleware.
 */
export function isAuthenticated (req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() || req.path === "/api/login") {
    return next();
  }
  return res.status(401).json({
    error: "Not authorized to view this resource."
  });
};
