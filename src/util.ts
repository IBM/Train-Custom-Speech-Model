'use strict';

import * as fs from 'fs';
import * as stream from 'stream';
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
  * Sign in using Email and Password.
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
    .getService(process.env.STT_SERVICE_NAME);
}

export function getSTTV1 (credentials: STTCredential) {
  return new SpeechToTextV1({
    username: credentials.username,
    password: credentials.password,
    url: credentials.url
  });
}

export interface STTCredential {
  username: string;
  password: string;
  url: string;
}

interface CustomModel {
  name: string;
  id: string
}

let models: CustomModel[] = [];

export function getCustomModelId(credentials: STTCredential, modelName: string): Promise<any[]> {
  let speech = getSTTV1(credentials);
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
          for (let index = 0, len = customModels.length; index < len; index++) {
            if (customModels[index].name === modelName) {
              models.push({name: modelName, id: customModels[index].customization_id});
              return resolve([undefined, customModels[index].customization_id]);
            }
          }
        }
      }
      //need to create custom model here
      speech.createLanguageModel(
        {
          name: modelName,
          base_model_name: 'en-US_BroadbandModel',
          description: `Custom model for ${credentials.username}`,
        }, function(error, languageModel) {
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

export function addCorpus(credentials: STTCredential, modelId: string, corpusName: string, corpus: string) {
  let speech = getSTTV1(credentials);
  let bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(corpus));

  var addCorpusParams = {
    customization_id: modelId,
    corpus_file: bufferStream,
    corpus_name: corpusName,
    allow_overwrite: true
  };

  return new Promise( (resolve, reject) => {
    speech.addCorpus(addCorpusParams, function(error: any) {
      if (error) {
        resolve(error);
      } else {
        resolve(undefined);
      }
    });
  })

}

export function addWord(credentials: STTCredential, modelId: string, word: string, soundsLike?: string[], displayAs?: string ){
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
        resolve(error);
      } else {
        resolve(undefined);
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

export async function trainModel(credentials: STTCredential, model: string): Promise<any>{
  let id = await getCustomModelId(credentials, model);
  return new Promise<any>((resolve, reject) => {
    if (id[0]) {
      resolve(id[0]);
    } else {
      let speech = getSTTV1(credentials);
      speech.trainLanguageModel({customization_id: id[1] }, function(error) {
        if (error) {
          resolve(error);
        } else {
          resolve(undefined);
        }
      });
    }
  });

}

export async function getModelStatus(credentials: STTCredential, model: string): Promise<any[]> {
  let id = await getCustomModelId(credentials, model);

  return new Promise<any[]>( (resolve, reject) => {
    if (id[0]) {
      resolve([id[0]]);
    } else {
      let speech = getSTTV1(credentials);
      speech.getLanguageModel({customization_id: id[1] }, function(error: any, languageModel: any) {
        if (error) {
          resolve([error]);
        } else {
          resolve([undefined, languageModel]);
        }
      });
    }
  });

}

export async function listWords(credentials: STTCredential, model: string): Promise<any[]> {
  let id = await getCustomModelId(credentials, model);

  return new Promise<any[]>((resolve, reject) => {
    if (id[0]) {
      resolve([id[0]]);
    } else {
      let speech = getSTTV1(credentials);
      speech.listWords({customization_id: id[1] }, function(error: any, results: any) {
        if (error) {
          resolve([error]);
        } else {
          resolve([undefined, results]);
        }
      });
    }
  });
}

/**
 * Login Required middleware.
 */
export function isAuthenticated (req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() || req.path === "/user/login"
      || req.path.match(/^\/(css|js|favicon)/)) {
    return next();
  }
  req.session.returnTo = req.path;
  res.redirect("/user/login");
};
