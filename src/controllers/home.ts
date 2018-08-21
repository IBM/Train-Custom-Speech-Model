'use strict';
import { Request, Response } from 'express';

/**
 * GET /
 * Home page.
 */
export function index(req: Request, res: Response) {
  return res.render('home', {
    title: 'Home',
    username: req.user.username,
    links: [
      {txt: 'Speech to Text', href: '/pages/stt'}
    ]
  });
};
