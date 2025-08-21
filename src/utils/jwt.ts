


import jwt, { SignOptions } from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || "ttdsjqnnwjw772h2b3233jejejejeje";

const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"]) || "7d";


export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JWTPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as JWTPayload;
};

export const decodeToken = (token: string): JWTPayload | null => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === "string") return null;
  return decoded as JWTPayload;
};
