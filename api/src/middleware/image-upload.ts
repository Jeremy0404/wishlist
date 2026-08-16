import type { RequestHandler } from "express";
import multer, { MulterError } from "multer";
import { BadRequestError } from "../errors.js";
import { MAX_IMAGE_BYTES } from "../uploads.js";

const parse = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
}).single("image");

export const IMAGE_TOO_LARGE = "Photo trop lourde (2 Mo maximum).";
export const IMAGE_UNSUPPORTED = "Formats acceptés : PNG, JPEG, WebP ou GIF.";

export const imageUpload: RequestHandler = (req, res, next) =>
  parse(req, res, (err: unknown) => {
    if (err instanceof MulterError) {
      return next(
        new BadRequestError(
          err.code === "LIMIT_FILE_SIZE" ? IMAGE_TOO_LARGE : IMAGE_UNSUPPORTED,
        ),
      );
    }
    next(err);
  });
