import { Request, Response } from "express";

/**
 * GET /
 * Home page.
 */
export let index = (req: Request, res: Response) => {
  if (req.user) {
    return res.render("home", {
      title: "Home",
      username: req.user.username
    });
  }
  res.redirect("/user/login");
 };
