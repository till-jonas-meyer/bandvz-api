import crypto from "node:crypto";
import multer from "multer";

const trackStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'storage/tracks/');
  },

  filename: (_req, file, cb) => {
    const extension = file.originalname
      .split(".")
      .pop();

    cb(
      null,
      `${crypto.randomUUID()}.${extension}`
    );
  },
});

export const uploadTrack = multer({
  storage: trackStorage,
});

const bandImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'storage/bandimgs/');
  },

  filename: (_req, file, cb) => {

    const extension = file.originalname
      .split('.')
      .pop();

    if (file.mimetype !== 'image/png') {
      cb(new Error('No PNG uploaded'), file.originalname);
    }

    cb(
      null,
      `${crypto.randomUUID()}.${extension}`
    );
  },
});

export const uploadBandImage = multer({
  storage: bandImageStorage,
});