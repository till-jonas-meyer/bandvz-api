import {
  Controller,
  Route,
  Get,
  Post,
  Delete,
  Security,
  Request,
  SuccessResponse
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AppDataSource } from '../../data-source';
import { Band, BandStatus } from '../../entities/band/Band';
import { User } from '../../entities/user/User';
import { HttpError } from '../../httpError';

@Route('band')
export class BandController extends Controller {

  @Post('create-draft')
  @SuccessResponse(200, 'Band was created')
  @Security('jwt')
  async createDraft(@Request() req: ExpressRequest) {

    const userRepo = AppDataSource.getRepository(User);
    const bandRepo = AppDataSource.getRepository(Band);

    const user = await userRepo.findOneBy({ id: req.user!.userId });

    const newBand = new Band();
    newBand.name = '';
    newBand.description = '';
    newBand.imgUuid = null;
    newBand.user = user!;
    newBand.status = BandStatus.draft;
    newBand.tracks = [];

    bandRepo.save(newBand);

    return { message: 'Band-Entwurf wurde erzeugt.' };
  }
}