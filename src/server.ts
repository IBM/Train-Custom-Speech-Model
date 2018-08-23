'use strict';
/**
 * Module dependencies.
 */
import * as bodyParser from 'body-parser';
import * as compression from 'compression';  // compresses requests
import * as express from 'express';
import * as session from 'express-session';
import * as path from 'path';
import * as util from './util';
import * as passport from 'passport';
import expressValidator = require('express-validator');

 /**
 * Routes
 */
import homeRouter from './routes/home';
import apiRouter from './routes/api';
import userRouter from './routes/user';
import pagesRouter from './routes/pages';

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
    this.express.set('port', process.env.PORT || 3000);
    this.express.set('views', path.join(__dirname, '..', 'views'));
    this.express.set('view engine', 'pug');
    this.express.set('stt_service', util.getCfenv());
    this.express.use(compression());
    this.express.use(expressValidator());
    this.express.use(session({
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET,
    }));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(passport.initialize());
    this.express.use(passport.session());
    this.express.use(util.isAuthenticated);
    this.express.use(
      express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 })
    );
  }

  /**
   * Primary app routes.
   */
  private routes(): void {
    this.express.use('/', homeRouter);
    this.express.use('/api', apiRouter);
    this.express.use('/user', userRouter);
    this.express.use('/pages', pagesRouter);
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
