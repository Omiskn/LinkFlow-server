import { Request, Response, NextFunction } from "express";
import { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/apiResponse";

const parseBearerToken = (authorization: string | undefined): string | null => {
  if (!authorization || typeof authorization !== "string") return null;

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!match?.[1]) return null;

  const token = match[1].trim();
  return token.length > 0 ? token : null;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = parseBearerToken(req.headers.authorization);

  if (!token) return sendError(res, "Unauthorized", 401);

  try {
    const decoded = verifyAccessToken(token) as JwtPayload;
    const userId = Number(decoded.sub);

    if (!Number.isInteger(userId) || userId < 1)
      return sendError(res, "Invalid token", 401);

    req.user = {
      userId,
      jti: typeof decoded.jti === "string" ? decoded.jti : undefined,
    };

    console.log(req.user);

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return sendError(res, "Token expired", 401);
    }

    return sendError(res, "Invalid token", 401);
  }
};
