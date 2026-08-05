import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './httpError';
import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET in .env not set.');
  process.exit(0);
}

const secret = process.env.JWT_SECRET;

export const expressAuthentication = async (
  request: Request,
  securityName: string,
  scopes?: string[]
) => {

  if (securityName !== 'jwt') {
    throw new HttpError(500, `Unknown security name ${securityName}`);
  }

  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new HttpError(500, 'No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  try {

    const payload = jwt.verify(token, secret);

    request.user = payload as Express.Request['user'];

    return payload;

  } catch {
    throw new HttpError(401, 'Invalid JWT');
  }
}