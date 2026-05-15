import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { sendError } from "../utils/apiResponse";

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

  console.log("hello from error middleware");

  sendError(res, message, statusCode);
  console.log(message);

  // res.status(statusCode).json({
  //   success: false,
  //   message,
  // });
};
