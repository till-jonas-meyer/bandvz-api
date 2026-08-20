import {
  Route,
  Controller,
  Post,
  Consumes,
  FormField,
  Middlewares,
  Security,
  Request,
  Response,
  SuccessResponse
} from 'tsoa';
import {
  uploadTrackMiddleware
} from '../../middleware/upload';
import { Request as ExpressRequest } from 'express';
import { AppDataSource } from '../../data-source';
import { Band } from '../../entities/band/Band';
import { Track } from '../../entities/track/Track';
import { HttpError } from '../../httpError';
import type { ErrorResponse } from '../../httpError';

@Route('track')
export class TrackController extends Controller {

  @Post('add')
  @Security('jwt')
  @Consumes('multipart/form-data')
  @Middlewares(uploadTrackMiddleware)
  @Response<ErrorResponse>(404, 'Band not found')
  @Response<ErrorResponse>(403, 'No rights to alter Band')
  @SuccessResponse(201, 'Track was created')
  async addTrack(
    @Request() req: ExpressRequest,
    @FormField() bandId: number,
    @FormField() title: string,
  ) {

    const userId = req.user!.userId;

    const bandRepo = AppDataSource.getRepository(Band);
    const trackRepo = AppDataSource.getRepository(Track);

    const band = await bandRepo.findOne({
      where: { id: bandId },
      relations: { user: true }
    });

    if (!band) {
      throw new HttpError(400, 'Band not found');
    }

    if (band.user.id !== userId) {
      throw new HttpError(403, 'No rights to edit this band');
    }

    const trackUuid = req.file!.filename.split('.')[0]!;

    const newTrack = new Track();

    newTrack.title = title;
    newTrack.uuid = trackUuid;
    newTrack.band = band;

    // Get MAX of "order"
    const result = await trackRepo.createQueryBuilder('track')
      .select('MAX(track.order)', 'maxOrder')
      .getRawOne();
    const maxOrder = result?.maxOrder;

    newTrack.order = maxOrder + 1;

    trackRepo.save(newTrack);

    return {
      uuid: newTrack.uuid
    };
  }
}