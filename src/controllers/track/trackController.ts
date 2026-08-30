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
  SuccessResponse,
  Get,
  Path,
  Put,
  Body,
  Delete
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
import fs from 'fs/promises';

type UpdateParameters = {
  title: string;
};

type ReorderParameters = {
  uuid: string;
  title: string;
}[];

@Route('track')
export class TrackController extends Controller {

  @Post('add')
  @Security('jwt')
  @Consumes('multipart/form-data')
  @Middlewares(uploadTrackMiddleware)
  @Response<ErrorResponse>(404, 'Band not found')
  @Response<ErrorResponse>(403, 'No rights to alter Band')
  @Response<ErrorResponse>(409, 'Maximum number of tracks reached')
  @Response<ErrorResponse>(422, 'Field too long')
  @SuccessResponse(201, 'Track was created')
  async addTrack(
    @Request() req: ExpressRequest,
    @FormField() bandId: number,
    @FormField() title: string,
  ) {

    if (title.length > Number(process.env.MAX_LENGTH_TRACK_TITLE)) {
      throw new HttpError(422, 'Track title too long');
    }

    const userId = req.user!.userId;

    const bandRepo = AppDataSource.getRepository(Band);
    const trackRepo = AppDataSource.getRepository(Track);

    const band = await bandRepo.findOne({
      where: { id: bandId },
      relations: { user: true, tracks: true }
    });

    if (!band) {
      throw new HttpError(400, 'Band not found');
    }

    if (band.user.id !== userId) {
      throw new HttpError(403, 'No rights to edit this band');
    }

    if (band.tracks.length >= Number(process.env.MAX_NUM_TRACKS_PER_BAND)) {
      throw new HttpError(409, 'Maximum number of tracks for band reached.');
    }

    const trackUuid = req.file!.filename.split('.')[0]!;

    const extension = req.file!.filename
      .split('.')
      .pop();

    const newTrack = new Track();

    newTrack.title = title;
    newTrack.uuid = trackUuid;
    newTrack.band = band;
    newTrack.fileExt = extension!;

    // Get MAX of "order"
    const result = await trackRepo.createQueryBuilder('track')
      .select('MAX(track.order)', 'maxOrder')
      .getRawOne();
    const maxOrder = result?.maxOrder;

    newTrack.order = maxOrder + 1;

    await trackRepo.save(newTrack);

    return {
      uuid: newTrack.uuid
    };
  }

  @Get('get/{trackUuid}')
  @Response<ErrorResponse>(404, 'Track not found')
  @SuccessResponse(200, 'Track found')
  async getTrack(@Path() trackUuid: string) {

    const trackRepo = AppDataSource.getRepository(Track);

    const track = await trackRepo.findOneBy({ uuid: trackUuid });

    if (!track) {
      throw new HttpError(404, 'Track not found.');
    }

    const { title, uuid, fileExt } = track;

    return { title, uuid, fileExt };
  }

  @Put('update/{trackUuid}')
  @Security('jwt')
  @Response<ErrorResponse>(404, 'Track not found')
  @Response<ErrorResponse>(403, 'No rights')
  @SuccessResponse(200, 'Track updated')
  async updateTrack(
    @Path() trackUuid: string,
    @Body() body: UpdateParameters,
    @Request() req: ExpressRequest
  ) {

    const userId = req.user!.userId;

    const trackRepo = AppDataSource.getRepository(Track);

    const track = await trackRepo.findOne({
      where: { uuid: trackUuid },
      relations: { band: { user: true } },
    });

    if (!track) {
      throw new HttpError(404, 'Track not found')
    }

    if (track.band.user.id !== userId) {
      throw new HttpError(403, 'No rights')
    }

    track.title = body.title;

    await trackRepo.save(track);

    return { message: 'Track wurde aktualisiert.' };
  }

  @Delete('delete/{trackUuid}')
  @Security('jwt')
  async deleteTrack(
    @Path() trackUuid: string,
    @Request() req: ExpressRequest
  ) {

    const userId = req.user!.userId;

    const trackRepo = AppDataSource.getRepository(Track);

    const track = await trackRepo.findOne({
      where: { uuid: trackUuid },
      relations: { band: { user: true } },
    });

    if (!track) {
      throw new HttpError(404, 'Track not found')
    }

    if (track.band.user.id !== userId) {
      throw new HttpError(403, 'No rights')
    }

    try {
      await fs.unlink(`storage/tracks/${track.uuid}.mp3`);
    } catch (e) { }

    await trackRepo.delete(track.uuid);

    return { message: 'Track wurde gelöscht.' };
  }

  @Get('band-tracks/{bandId}')
  @SuccessResponse(200, 'Tracklist found')
  async getTracksForBand(
    @Path() bandId: number,
  ) {

    const trackRepo = AppDataSource.getRepository(Track);

    const tracks = await trackRepo.find({
      where: { band: { id: bandId } },
      order: {
        order: 'ASC'
      }
    }
    );

    return tracks.map(track => ({
      uuid: track.uuid,
      title: track.title,
      fileExt: track.fileExt,
    }));

  }

  @Post('reorder/{bandId}')
  @SuccessResponse(200, 'Tracks were reordered')
  @Response<ErrorResponse>(404, 'Band not found')
  @Response<ErrorResponse>(400, 'Problem in matching lists')
  @Response<ErrorResponse>(403, 'No rights')
  @Security('jwt')
  async reorder(
    @Path() bandId: number,
    @Request() req: ExpressRequest,
    @Body() body: ReorderParameters
  ) {
    const userId = req.user!.userId;

    const bandRepo = AppDataSource.getRepository(Band);
    const trackRepo = AppDataSource.getRepository(Track);

    const band = await bandRepo.findOne({
      where: { id: bandId },
      relations: { tracks: true, user: true }
    });

    if (!band) {
      throw new HttpError(404, 'Band not found');
    }

    if (band.user.id !== userId) {
      throw new HttpError(403, 'Tracklist not editable for user')
    }

    const oldTracks = band.tracks;

    // Check that the lists are set equal
    function tracksFound(tracklist1: Track[], tracklist2: ReorderParameters) {
      return tracklist1.every(array1Element => {
        return tracklist2.find(array2Element => array2Element.uuid === array1Element.uuid);
      })
    }

    if (!tracksFound(oldTracks, body) || oldTracks.length !== body.length) {
      throw new HttpError(400, 'Problem matching tracklists');
    }

    for (let order = 0; order < body.length; order++) {
      const oldTrack = oldTracks.find(t => t.uuid === body[order]!.uuid);
      if (!oldTrack) {
        throw new HttpError(400, 'Track could not be matched');
      }
      oldTrack.order = order + 1;
    }

    await trackRepo.save(oldTracks);

    return { message: 'Tracks were reordered.' };
  }
}