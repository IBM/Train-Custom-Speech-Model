'use strict';
import { Request, Response } from 'express';
import * as passport from 'passport';
import { User } from '../util';

/**
 * POST /login
 * Sign in using username and password.
 */
export let postLogin = (req: Request, res: Response) => {
  req.assert('username', 'Username cannot be blank').notEmpty();
  req.assert('password', 'Password cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    return res.status(401).json({
      error: 'There was an error logging in.',
      authenticated: false
    });
  }
  passport.authenticate('local', (err: Error, user: User) => {
    if (err) {
      return res.status(401).json({
        error: `There was an error authenticating: ${err}`,
        authenticated: false
      });
    }
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. Please try again.',
        authenticated: false
      });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(401).json({
          error: `There was an error authenticating: ${err}`,
          authenticated: false
        });
      }
      const returnTo = req.session.returnTo || '/';
      delete req.session.returnTo;
      return res.status(200).json({
        user: req.user,
        authenticated: true,
        returnTo
      });
    });
    return null;
  })(req, res);
  return null;
};

/**
 * GET /user
 * Check authentication status of current user.
 */
export let getUser = (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      user: req.user,
      authenticated: true
    });
  }
  else {
    return res.status(401).json({
      error: 'User is not authenticated',
      authenticated: false
    });
  }
};

/**
 * POST /logout
 * Log out.
 */
export let postLogout = (req: Request, res: Response) => {
  req.logout();
  res.status(200).send('OK');
};
