"use strict";

import * as util from "../util";
import { Request, Response } from "express";


/**
 * GET /api
 */
export let getApi = (req: Request, res: Response) => {
  res.send("Hello Custom Watson Language Model");
};

export let listModels = (req: Request, res: Response) => {
  let speechToText = util.getSTTV1(req);
  speechToText.listLanguageModels(null, (error: any, languageModels: any) => {
    if (error) {
      res.send(error);
    } else {
      res.send(JSON.stringify(languageModels, null, 2));
    }
  });
}

