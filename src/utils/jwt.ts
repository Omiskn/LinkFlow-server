import crypto from "crypto";
import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { env } from "../config/env";

const signOptions: SignOptions = {
  algorithm: "HS256",
  expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

const verifyOptions: VerifyOptions = {
  algorithms: ["HS256"],
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

export const generateToken = (userId: number) => {
  const jti = crypto.randomUUID();
  return jwt.sign(
    {
      sub: String(userId),
      jti,
    },
    env.JWT_SECRET,
    signOptions,
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET, verifyOptions);
};
