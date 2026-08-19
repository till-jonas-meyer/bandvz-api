import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { uploadTrack, uploadBandImage } from '../multer';

export function uploadTrackMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  uploadTrack.single('audioFile')(req, res, (err) => {
    if (err) {
      return next(err);
    }

    next();
  });
}

export function uploadBandImageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  uploadBandImage.single('bandImgFile')(req, res, (err) => {
    if (err) {
      return next(err);
    }

    next();
  });
}