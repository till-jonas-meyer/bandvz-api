import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { uploadTrack } from '../multer';

export function uploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  uploadTrack.single('file')(req, res, (err) => {
    if (err) {
      return next(err);
    }

    next();
  });
}