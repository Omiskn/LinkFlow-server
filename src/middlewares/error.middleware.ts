import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export const errorMiddleware = (
  err: { statusCode?: number; message?: string },
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;
  const message =
    isServerError && env.isProd
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
