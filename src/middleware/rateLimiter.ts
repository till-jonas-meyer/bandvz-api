import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { Request as ExpressRequest } from 'express';
import 'dotenv/config';

if (isNaN(Number(process.env.RATE_LIMITING))) {
  console.error('RATE_LIMITING variable in .env is not a number.');
  process.exit(1);
}

export const getRateLimitKey = (req: ExpressRequest) => {
  let ipKey = 'no-ip';

  if (req?.ip) {
    ipKey = ipKeyGenerator(req.ip);
  }

  const path = req?.path || 'no-path';

  return `${ipKey}--${path}`;
};

export const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.RATE_LIMITING) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.'
  },
  keyGenerator: getRateLimitKey,
});
