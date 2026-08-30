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

    if (!extension) {
      cb(new Error('File has no extension'), file.originalname)
    }

    if (file.mimetype !== 'audio/mpeg') {
      cb(new Error('Uploaded file is not an MP3'), file.originalname);
    }

    // Allow max. 10 MB file size
    if (file.size > 10 * 1024 * 1024) {
      cb(new Error('Uploaded file is too big'), file.originalname);
    }

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

    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Uploaded file is not an image file'), file.originalname);
    }

    // Allow max. 10 MB file size
    if (file.size > 10 * 1024 * 1024) {
      cb(new Error('Uploaded file is too big'), file.originalname);
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