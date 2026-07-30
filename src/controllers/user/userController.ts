import {
  Controller,
  Route,
  Get,
  Post,
  Path,
  Query,
  Request,
} from 'tsoa';

import jwt from 'jsonwebtoken';

type User = {
  id: number;
  email: string;
}

type LoginParameters = {
  email: string;
  password: string;
}

type LoginResult = {
  token: string;
}

@Route('user')
export class UserController extends Controller {

  @Post('login')
  public async login(@Request() req: LoginParameters): Promise<LoginResult> {
    const token = jwt.sign({ email: req.email }, process.env.JWT_SECRET!);
    return { token };
  }

  @Get('{userId}')
  public async getUser(@Path() userId: number): Promise<User> {
    return {
      id: userId,
      email: 'johndoe@example.com'
    }
  }
}