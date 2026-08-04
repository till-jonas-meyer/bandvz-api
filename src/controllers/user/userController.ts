import {
  Controller,
  Route,
  Get,
  Post,
  Path,
  Query,
  Request,
  Body,
  Response,
  Middlewares
} from 'tsoa';
import jwt from 'jsonwebtoken';
import "dotenv/config";
import { HttpError } from '../../httpError';
import { AppDataSource } from '../../data-source';
import { User } from '../../entities/user/User';
import { rateLimiter, getRateLimitKey } from '../../middleware/rateLimiter';
import argon2 from 'argon2';
import { Request as ExpressRequest } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { randomBytes, createHash } from 'crypto';
import { sendMail } from '../../email';

type LoginParameters = {
  email: string;
  password: string;
}

type RegisterParamaters = {
  email: string;
  password: string;
}

@Route('user')
export class UserController extends Controller {

  @Post('login')
  @Response(500, 'Invalid JWT secret or other server error')
  @Response(200, 'Successful login')
  @Response(401, 'Credentials invalid')
  @Middlewares(rateLimiter)
  public async login(@Body() body: LoginParameters, @Request() req: ExpressRequest) {

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new HttpError(500, 'Invalid JWT secret');
    }

    const repo = AppDataSource.getRepository(User);

    const user = await repo.findOneBy({ email: body.email });

    if (user === null) {
      throw new HttpError(401, `Benutzer mit E-Mail ${body.email} nicht gefunden.`);
    }

    if (!user.active) {
      throw new HttpError(401, `Benutzer mit E-Mail ${body.email} wurde noch nicht aktiviert.`)
    }

    const passwordCorrect = await argon2.verify(user.password, body.password);

    if (!passwordCorrect) {
      throw new HttpError(401, 'Das eingegebene Passwort ist falsch.');
    }

    const clientIp = req.ip;

    if (clientIp) {
      rateLimiter.resetKey(getRateLimitKey(req));
    }

    const token = jwt.sign({ email: body.email }, process.env.JWT_SECRET!);
    return { token };
  }

  @Post('register')
  @Response(200, 'Successfully registered')
  @Middlewares(rateLimiter)
  public async register(@Body() body: RegisterParamaters) {

    const repo = AppDataSource.getRepository(User);

    // Check if user already exists
    const existing = await repo.existsBy({ email: body.email });
    if (existing) {
      throw new HttpError(409, 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
    }

    const activationCode = randomBytes(32).toString('utf-8');
    const activationCodeHash = createHash('sha256').update(activationCode).digest('hex');
    const hashedPassword = await argon2.hash(body.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const newUser = {
      email: body.email,
      password: hashedPassword,
      activationCode: activationCodeHash,
      active: false,
    };

    await repo.save(newUser);

    await sendMail(
      newUser.email,
      'Aktivierung ihres Benutzerkontos bei BandVZ',
      'activation-link',
      {
        frontendUrl: process.env.FRONTEND_URL,
        activationCode
      }
    );

    return {};
  }

  @Get('{userId}')
  public async getUser(@Path() userId: number) {
    return {
      id: userId,
      email: 'johndoe@example.com'
    }
  }
}