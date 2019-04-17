'use strict';
/**
 * Module dependencies.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';  // compresses requests
import * as cors from 'cors';
import * as express from 'express';
import * as session from 'express-session';
import {User, getCfenv, wsHandler } from './util';
import * as crypto from 'crypto';
import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import * as expressValidator from 'express-validator';
import * as bunyanFactory from 'express-bunyan-logger';
import { Server as WSServer } from 'ws';
import * as http from 'http';

 /**
  * Routes
  */
import {router} from './routes/api';

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
    initPassport();
    this.express.set('port', process.env.PORT || 5000);
    this.express.set('stt_service', getCfenv());
    this.express.use(cors(
      { origin: 'http://localhost:3000', credentials: true }
    ));
    this.express.use(bunyanFactory({
      excludes: ['req', 'res',
        'req-headers', 'res-headers',
        'response-hrtime', 'user-agent'],
      obfuscate: ['body.password']
  }));
    this.express.use(compression());
    this.express.use(expressValidator());
    this.express.use(session({
      resave: true,
      saveUninitialized: true,
      secret: crypto.randomBytes(64).toString('hex'),
    }));
    this.express.use(bodyParser.json({limit: '2mb'}));
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(passport.initialize());
    this.express.use(passport.session());
    this.express.use(isAuthenticated);
  }

  /**
   * Primary app routes.
   */
  private routes(): void {
    this.express.use('/api', router);
    this.express.use(
      express.static(path.join(__dirname, '..', 'client', 'build'))
    );
    this.express.get('/*', (req, res) => {
      res.sendFile(
        path.join(__dirname, '..', 'client' , 'build', 'index.html')
      );
    });
  }

  private launchConf() {

    /**
     * Start Express server.
     */

    const server = http.createServer();
    const wss = new WSServer({server});
    server.on('request', this.express);
    wss.on('connection', wsHandler);
    server.listen(this.express.get('port'), () => {
      // tslint:disable-next-line:no-console
      console.log(('  App is running at http://localhost:%d \
      in %s mode'), this.express.get('port'), this.express.get('env'));
      // tslint:disable-next-line:no-console
      console.log('  Press CTRL-C to stop');
    })
    .setTimeout(600000);
  }
}

function initPassport() {
  /*
  * Sign in using Username and Password.
  */

  const users = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'model', 'user.json')).toString());

  passport.serializeUser<User, string>((user: User, done) => {
    done(undefined, user.username);
  });

  passport.deserializeUser<User, string>((username: string, done) => {
    done(undefined, Object.assign( {username}, users[username]));
  });

  passport.use(new LocalStrategy(
    { usernameField: 'username' },
    (username: string, password: string, done: Function) => {
      if (users[username]) {
        if (users[username].password === password) {
          return done(undefined,
            Object.assign({username}, users[username]));
        }
        return done(undefined,
                    false,
                    { message: 'Invalid username or password.' });
      } else {
        return done(undefined,
                    false,
                    { message: `user: ${username} doesn't exist` });
      }
  }));
}

/**
 * Login Required middleware.
 */
function isAuthenticated (req: express.Request, res: express.Response,
    next: express.NextFunction) {
  if (req.isAuthenticated() || req.path === '/api/login' ||
    !(req.path.includes('api'))) {
      return next();
  }
  return res.status(401).json({
    error: 'Not authorized to view this resource.'
  });
}

export let server = (new App()).express;
