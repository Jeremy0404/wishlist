import { ZodError } from "zod";

export type FieldError = { field: string; reason: string };

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
  fieldErrors?: FieldError[];

  constructor(options: {
    message: string;
    statusCode?: number;
    code?: string;
    details?: unknown;
    fieldErrors?: FieldError[];
  }) {
    super(options.message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "ERROR";
    this.details = options.details;
    this.fieldErrors = options.fieldErrors;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Données invalides", fieldErrors?: FieldError[], details?: unknown) {
    super({
      message,
      statusCode: 400,
      code: "VALIDATION_ERROR",
      fieldErrors,
      details,
    });
  }

  static fromZod(error: ZodError, message = "Données invalides") {
    const fieldErrors = Object.entries(error.flatten().fieldErrors).flatMap(
      ([field, reasons]) => (reasons ?? []).map((reason) => ({ field, reason })),
    );

    return new ValidationError(message, fieldErrors);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requête invalide", details?: unknown) {
    super({ message, statusCode: 400, code: "BAD_REQUEST", details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "unauthorized") {
    super({ message, statusCode: 401, code: "UNAUTHORIZED" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "forbidden") {
    super({ message, statusCode: 403, code: "FORBIDDEN" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "not found") {
    super({ message, statusCode: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends AppError {
  constructor(message = "conflict") {
    super({ message, statusCode: 409, code: "CONFLICT" });
  }
}

export class UnexpectedError extends AppError {
  constructor(message = "Erreur serveur", details?: unknown) {
    super({ message, statusCode: 500, code: "UNEXPECTED_ERROR", details });
  }
}
