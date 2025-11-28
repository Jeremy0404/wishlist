import { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  const requestId = req.id;
  res.status(404).json({
    code: "NOT_FOUND",
    message: "Route non trouvée",
    ...(requestId ? { requestId } : {}),
  });
}
