import crypto from "node:crypto";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "tracks/");
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
  storage,
});