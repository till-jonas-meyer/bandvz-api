import {
  Controller,
  Route,
  Get,
  Post,
  Path,
  Query,
  Request,
  Body,
  Response
} from 'tsoa';
import jwt from 'jsonwebtoken';
import "dotenv/config";
import { HttpError } from '../../httpError';
import { AppDataSource } from '../../data-source';

import { User } from '../../entities/user/User';

type LoginParameters = {
  email: string;
  password: string;
}

@Route('user')
export class UserController extends Controller {

  @Post('login')
  @Response(500, 'Invalid JWT secret')
  public async login(@Body() body: LoginParameters) {

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new HttpError(500, 'Invalid JWT secret');
    }

    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(User);

    const userActive = await repo.findOneBy({ email: body.email, active: true });
    const user = await repo.findOneBy({ email: body.email });

    if (userActive === null) {
      if (user === null) {
        throw new HttpError(401, `Benutzer mit E-Mail ${body.email} nicht gefunden.`);
      }
      throw new HttpError(401, `Benutzer mit E-Mail ${body.email} wurde noch nicht aktiviert.`)
    }

    const token = jwt.sign({ email: body.email }, process.env.JWT_SECRET!);
    return { token };
  }

  @Get('{userId}')
  public async getUser(@Path() userId: number) {
    return {
      id: userId,
      email: 'johndoe@example.com'
    }
  }
}