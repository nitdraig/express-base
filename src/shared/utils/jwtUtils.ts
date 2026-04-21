import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { IncomingHttpHeaders } from "http";
import { ENV } from "../config/env";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

const jwtSecret: Secret = ENV.JWT_SECRET;

export const generateJWT = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ENV.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, jwtSecret, options);
};

export const verifyJWT = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};

export const getTokenFromHeaders = (
  headers: IncomingHttpHeaders
): string | null => {
  const raw = headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (header?.startsWith("Bearer ")) {
    return header.split(" ")[1] ?? null;
  }
  return null;
};
