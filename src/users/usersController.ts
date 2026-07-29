import {
  Controller,
  Route,
  Get,
  Path,
  Query,
} from 'tsoa';

type User = {
  id: number;
  email: string;
}

@Route('users')
export class UsersController extends Controller {
  @Get('{userId}')
  public async getUser(@Path() userId: number): Promise<User> {
    return {
      id: userId,
      email: 'johndoe@example.com'
    }
  }
}