import { NextFunction, Request, Response } from "express";
import * as passport from "passport";
import { User } from "../util";

/**
 * GET /login
 * Login page.
 */
export function getLogin (req: Request, res: Response) {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("user/login", {
    title: "Login",
  });
};

/**
 * POST /login
 * Sign in using user and password.
 */
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
  req.assert("username", "Username cannot be blank").notEmpty();
  req.assert("password", "Password cannot be blank").notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    return res.redirect("/user/login");
  }

  passport.authenticate("local", (err: Error, user: User) => {
    if (err) { return next(err); }
    if (!user) {
      return res.redirect("/user/login");
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      res.redirect(req.session.returnTo || "/");
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
export let logout = (req: Request, res: Response) => {
  req.logout();
  res.redirect("/");
};
