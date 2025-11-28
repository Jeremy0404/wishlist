import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, UnexpectedError, ValidationError } from "../errors.js";
import { getRequestLogger } from "../logging/logger.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const log = getRequestLogger(req, { module: "error" });
  const requestId = req.id;

  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = ValidationError.fromZod(err);
  } else {
    appError = new UnexpectedError();
    log.error(
      {
        err,
        route: `${req.method} ${req.url}`,
        userId: req?.user?.id,
        requestId,
      },
      "Unhandled error",
    );
  }

  if (appError.statusCode >= 500) {
    log.error({ err, requestId }, appError.message);
  } else if (appError.statusCode >= 400) {
    log.warn({ err, requestId }, appError.message);
  }

  const body: Record<string, unknown> = {
    code: appError.code,
    message: appError.message,
  };

  if (appError.fieldErrors?.length) body.fieldErrors = appError.fieldErrors;
  if (appError.details) body.details = appError.details;
  if (requestId) body.requestId = requestId;

  res.status(appError.statusCode).json(body);
}
