"use strict";

import { Request } from "express";
import * as cfenv from "cfenv";
import * as path from "path";
import SpeechToTextV1 = require("watson-developer-cloud/speech-to-text/v1");


interface CfenvOpt {
  [vcapFile: string]: any
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
