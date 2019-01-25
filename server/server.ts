'use strict';
/**
 * Module dependencies.
 */
import * as bodyParser from 'body-parser';
import * as compression from 'compression';  // compresses requests
import * as express from 'express';
import * as session from 'express-session';
import * as util from './util';
import * as crypto from 'crypto';
import * as passport from 'passport';
import expressValidator = require('express-validator');

 /**
 * Routes
 */
import apiRouter from './routes/api';

/**
 * API keys and Passport configuration.
 */
class App {

  // ref to Express instance
  public express: express.Application;

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.launchConf();
  }

  private middleware(): void {
    util.initPassport();
    this.express.set('port', process.env.PORT || 5000);
    this.express.set('stt_service', util.getCfenv());
    this.express.use(compression());
    this.express.use(expressValidator());
    this.express.use(session({
      resave: true,
      saveUninitialized: true,
      secret: crypto.randomBytes(64).toString('hex'),
    }));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(passport.initialize());
    this.express.use(passport.session());
    this.express.use(util.isAuthenticated);
  }

  /**
   * Primary app routes.
   */
  private routes(): void {
    this.express.use('/api', apiRouter);
  }

  private launchConf() {

    /**
     * Start Express server.
     */
    this.express.listen(this.express.get('port'), () => {
      // tslint:disable-next-line:no-console
      console.log(('  App is running at http://localhost:%d \
      in %s mode'), this.express.get('port'), this.express.get('env'));
      // tslint:disable-next-line:no-console
      console.log('  Press CTRL-C to stop');
    });
  }
}

export default new App().express;
