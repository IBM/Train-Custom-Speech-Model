"use strict";

import * as fs from "fs";
import { Request, Response, NextFunction } from "express";
import * as cfenv from "cfenv";
import * as path from "path";
import * as passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import SpeechToTextV1 = require("watson-developer-cloud/speech-to-text/v1");


interface CfenvOpt {
  [vcapFile: string]: any
}

export interface User {
  username: string;
  customModel: string;
}

export function initPassport() {
  /*
  * Sign in using Email and Password.
  */

  let users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "model", "user.json")).toString());
  passport.serializeUser<any, any>((user: User, done) => {
    done(undefined, user.username);
  });

  passport.deserializeUser((username: string, done) => {
    done(undefined, {username: username, customModel: users[username].customModel});
  });

  passport.use(new LocalStrategy({ usernameField: "username" }, (username: string, password: string, done: Function) => {
    if (users[username]) {
      if (users[username].password === password) {
        let user: User = {username: username, customModel: users[username].customModel};
        return done(undefined, user);
      }
      return done(undefined, false, { message: "Invalid username or password." });
    } else {
      return done(undefined, false, { message: `user: ${username} doesn't exist` });
    }
  }));
}

export function getCfenv () {
  let cfenvOpt: CfenvOpt = {};

  // For local development
  if (!process.env.VCAP_APPLICATION) {
    cfenvOpt.vcapFile = path.join(__dirname, "..", "services.json");
  }
  return cfenv.getAppEnv(cfenvOpt)
    .getService(process.env.STT_SERVICE_NAME);
}

export function getSTTV1 (req: Request) {
  return new SpeechToTextV1({
    username: req.app.get("stt_service").credentials.username,
    password: req.app.get("stt_service").credentials.password
  });
}

/**
 * Login Required middleware.
 */
export function isAuthenticated (req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/user/login");
};
