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
  SuccessResponse,
  Middlewares,
  Security
} from 'tsoa';
import jwt from 'jsonwebtoken';
import "dotenv/config";
import { HttpError } from '../../httpError';
import { AppDataSource } from '../../data-source';
import { User } from '../../entities/user/User';
import { rateLimiter, getRateLimitKey } from '../../middleware/rateLimiter';
import argon2 from 'argon2';
import {
  Request as ExpressRequest,
  Response as ExpressResponse
} from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { randomBytes, createHash } from 'crypto';
import { sendMail } from '../../email';
import { hashPassword } from '../../helpers/hashPassword';
import type { ErrorResponse } from '../../httpError';

type LoginParameters = {
  email: string;
  password: string;
};

type RegisterParameters = {
  email: string;
  password: string;
};

type ActivateParameters = {
  activationCode: string;
};

type ResetPasswordParameters = {
  email: string;
};

type ChangePasswordParameters = {
  resetCode: string;
  password: string;
};

@Route('user')
export class UserController extends Controller {

  @Post('login')
  @SuccessResponse(200, 'Successful login')
  @Response<ErrorResponse>(500, 'Invalid JWT secret or other server error')
  @Response<ErrorResponse>(401, 'Credentials invalid')
  @Middlewares(rateLimiter)
  public async login(@Body() body: LoginParameters, @Request() req: ExpressRequest) {

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new HttpError(500, 'Invalid JWT secret');
    }

    const repo = AppDataSource.getRepository(User);

    const user = await repo.findOneBy({ email: body.email });

    if (user === null) {
      throw new HttpError(401, `Ein Benutzer mit E-Mail-Adresse ${body.email} wurde nicht gefunden.`);
    }

    if (!user.active) {
      throw new HttpError(401, `Der Benutzer mit E-Mail-Adresse ${body.email} wurde noch nicht aktiviert.`)
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

    req.res!.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { email: user.email };
  }

  @Post('logout')
  @SuccessResponse(200, 'Logout successful')
  public async logout(@Request() req: ExpressRequest) {
    req.res!.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Du wurdest ausgelogt.' };
  }

  @Post('register')
  @SuccessResponse(200, 'Successfully registered')
  @Response<ErrorResponse>(409, 'User exists')
  @Response<ErrorResponse>(500, 'Error while registering')
  @Middlewares(rateLimiter)
  public async register(@Body() body: RegisterParameters) {

    const repo = AppDataSource.getRepository(User);

    // Check if user already exists
    const existing = await repo.existsBy({ email: body.email });
    if (existing) {
      throw new HttpError(409, 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
    }

    const activationCode = randomBytes(32).toString('hex');
    const activationCodeHash = createHash('sha256').update(activationCode).digest('hex');
    const hashedPassword = await hashPassword(body.password);

    const newUser = {
      email: body.email,
      password: hashedPassword,
      activationCode: activationCodeHash,
      active: false,
    };

    await repo.save(newUser);

    sendMail(
      newUser.email,
      'Aktivierung deines Benutzerkontos bei BandVZ',
      'activation-link',
      {
        frontendUrl: process.env.FRONTEND_URL,
        activationCode
      }
    );

    return { message: 'Du wurdest registriert.' };
  }

  @Post('activate')
  @SuccessResponse(200, 'Successfully activated')
  @Response<ErrorResponse>(404, 'User not found by activation code')
  @Response<ErrorResponse>(500, 'Error while activating')
  @Middlewares(rateLimiter)
  public async activate(@Body() body: ActivateParameters) {

    const repo = AppDataSource.getRepository(User);

    const activationCodeHash = createHash('sha256').update(body.activationCode).digest('hex');

    const user = await repo.findOneBy({ activationCode: activationCodeHash });

    if (user === null) {
      throw new HttpError(404, 'Es wurde kein Benutzer mit dem gegebenen Aktivierungscode gefunden.');
    }

    user.active = true;
    repo.save(user);

    return { message: 'Dein Benutzerkonto wurde aktiviert. Du kannst dich nun mit den vergebenen Zugangsdaten einloggen.' };
  }

  @Post('reset-password')
  @SuccessResponse(200, 'Reset code was generated and sent by mail')
  @Response<ErrorResponse>(500, 'Error while generating reset code')
  @Middlewares(rateLimiter)
  public async resetPassword(@Body() body: ResetPasswordParameters) {

    const repo = AppDataSource.getRepository(User);

    const user = await repo.findOneBy({ email: body.email });

    if (user !== null) {
      const resetCode = randomBytes(32).toString('hex');
      const resetCodeHash = createHash('sha256').update(resetCode).digest('hex');
      user.resetCode = resetCodeHash;
      repo.save(user);

      sendMail(
        user.email,
        'Passwort bei BandVZ zurücksetzen',
        'reset-link',
        {
          frontendUrl: process.env.FRONTEND_URL,
          resetCode: resetCode
        }
      );
    }

    return { message: `Ein Rücksetzungslink wurde an die angegebene E-Mail-Adresse ${body.email} geschickt, falls sie in der Datenbank existiert. Mit diesem Link kannst du dein Passwort neu vergeben.` };
  }

  @Post('change-password')
  @SuccessResponse(200, 'Password was changed')
  @Response<ErrorResponse>(404, 'User with reset code not found')
  @Response<ErrorResponse>(500, 'Error while changing password')
  @Middlewares(rateLimiter)
  public async changePassword(@Body() body: ChangePasswordParameters) {

    const repo = AppDataSource.getRepository(User);
    const resetCodeHash = createHash('sha256').update(body.resetCode).digest('hex');

    const user = await repo.findOneBy({ resetCode: resetCodeHash });

    if (user === null) {
      throw new HttpError(404, 'Es wurde kein Benutzer zu diesem Rücksetzungscode gefunden.');
    }
    user.resetCode = null;
    user.password = await hashPassword(body.password);
    await repo.save(user);

    return { message: 'Dein Passwort wurde geändert.' };
  }


  @Get('profile')
  @SuccessResponse(200, 'User found')
  @Response<ErrorResponse>(404, 'User not found')
  @Response<ErrorResponse>(500, 'Error while getting user')
  @Security('jwt')
  public async profile(@Request() req: ExpressRequest) {
    const repo = AppDataSource.getRepository(User);
    const email = req.user!.email;
    const user = await repo.findOneBy({ email });
    if (user === null) {
      throw new HttpError(404, `Es wurde kein Benutzer mit E-Mail-Adresse ${email} gefunden.`);
    }
    return { email: user.email };
  }
}