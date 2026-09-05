import {
  Body,
  Controller,
  Route,
  Get,
  Post,
  Put,
  Delete,
  Security,
  Request,
  SuccessResponse,
  Response,
  Middlewares,
  Path,
  Consumes,
  FormField,
  UploadedFile,
} from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { AppDataSource } from '../../data-source';
import { Band, BandStatus } from '../../entities/band/Band';
import { Track } from '../../entities/track/Track';
import { User } from '../../entities/user/User';
import { HttpError } from '../../httpError';
import { uploadBandImageMiddleware } from '../../middleware/upload';
import type { ErrorResponse } from '../../httpError';
import fs from 'fs/promises';
import { getBandImgFilename } from '../../helpers/getBandImgFilename';
import 'dotenv/config';

type GetRandomBandsParameters = {
  pageSize: number;
};

type GetBandsParameters = {
  pageSize: number;
  searchTerm: string;
};

@Route('band')
export class BandController extends Controller {

  @Post('create-draft')
  @SuccessResponse(201, 'Band was created')
  @Response<ErrorResponse>(404, 'User not found')
  @Response<ErrorResponse>(409, 'Maximum number of bands reached')
  @Security('jwt')
  async createDraft(@Request() req: ExpressRequest) {

    const userRepo = AppDataSource.getRepository(User);
    const bandRepo = AppDataSource.getRepository(Band);

    const user = await userRepo.findOne({
      where: { id: req.user!.userId },
      relations: { bands: true }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    if (user.bands.length >= Number(process.env.MAX_NUM_BANDS_PER_USER)) {
      throw new HttpError(409, 'Maximum number of bands per user reached.');
    }

    const newBand = new Band();
    newBand.name = '';
    newBand.description = '';
    newBand.imgUuid = null;
    newBand.imgExt = null;
    newBand.user = user;
    newBand.status = BandStatus.draft;
    newBand.tracks = [];

    const savedBand = await bandRepo.save(newBand);

    return { bandId: savedBand.id };
  };

  @Put('update/{bandId}')
  @Security('jwt')
  @Middlewares(uploadBandImageMiddleware)
  @Consumes('multipart/form-data')
  @SuccessResponse(200, 'Band was updated')
  @Response<ErrorResponse>(422, 'Field to long')
  @Response<ErrorResponse>(404, 'Band not found')
  @Response<ErrorResponse>(403, 'No rights')
  @Response<ErrorResponse>(400, 'Bad request')
  async updateBand(
    @Path() bandId: string,
    @Request() req: ExpressRequest,
    @FormField() name: string,
    @FormField() description: string,
    @FormField() imageAction: 'keep' | 'replace' | 'delete',
  ) {

    if (name.length > Number(process.env.MAX_LENGTH_BAND_NAME)) {
      throw new HttpError(422, 'Band name too long');
    }

    if (description.length > Number(process.env.MAX_LENGTH_BAND_DESCRIPTION)) {
      throw new HttpError(422, 'Band description too long');
    }

    const userRepo = AppDataSource.getRepository(User);
    const bandRepo = AppDataSource.getRepository(Band);

    const user = await userRepo.findOneBy({ id: req.user!.userId });
    const band = await bandRepo.findOne({
      where: { id: Number(bandId) },
      relations: { user: true }
    });

    if (!band) {
      throw new HttpError(404, 'Band was not found.');
    }

    // Check if user can access band
    if (band.user.id !== user!.id) {
      throw new HttpError(403, 'User cannot update band');
    }

    if (imageAction === 'delete') {
      if (band.imgUuid) {
        await fs.unlink(getBandImgFilename(band.imgUuid, band.imgExt));
      }
      band.imgUuid = null;
      bandRepo.save(band);
    }

    if (imageAction === 'replace') {

      // Remove existing file
      if (band.imgUuid) {
        await fs.unlink(getBandImgFilename(band.imgUuid, band.imgExt));
      }

      if (!req?.file) {
        throw new HttpError(400, 'Bad reqeust');
      }

      // Store new imgUuid 
      const newUuid = req.file.filename.split('.')[0]!;

      let newExt: string | null | undefined = req.file.filename.split('.').pop();

      if (!newExt) {
        newExt = null;
      }

      band.imgUuid = newUuid;
      band.imgExt = newExt;
      bandRepo.save(band);
    }

    band.name = name;
    band.description = description;
    band.status = BandStatus.active;
    bandRepo.save(band);

    return { message: 'Band wurde aktualisiert.' };
  };

  @Delete('delete/{bandId}')
  @Security('jwt')
  @Response<ErrorResponse>(403, 'No rights')
  @SuccessResponse(200, 'Band deleted')
  async deleteBand(
    @Path() bandId: string,
    @Request() req: ExpressRequest,
  ) {
    const bandRepo = AppDataSource.getRepository(Band);
    const band = await bandRepo.findOne({
      where: { id: Number(bandId) },
      relations: { user: true, tracks: true }
    });

    if (!band) {
      return { message: 'Band not found' };
    }

    if (band.user.id !== req.user!.userId) {
      throw new HttpError(403, 'User cannot delete band');
    }

    try {
      if (band.imgUuid) {
        await fs.unlink(getBandImgFilename(band.imgUuid, band.imgExt));
      }
    } catch (e) { }

    for (const track of band.tracks) {
      try {
        await fs.unlink(`storage/tracks/${track.uuid}.${track.fileExt}`);
      } catch (e) { }
    }

    bandRepo.delete(band.id);

    return { message: `Band ${band.name} wurde gelöscht.` };
  }

  @Get('get/{bandId}')
  @Response<ErrorResponse>(404, 'Band not found')
  @SuccessResponse(200, 'Band was found')
  async getBand(
    @Path() bandId: string,
  ) {
    const bandRepo = AppDataSource.getRepository(Band);
    const band = await bandRepo.findOne({
      where: { id: Number(bandId) },
      relations: { user: true }
    });

    if (!band) {
      throw new HttpError(404, 'Band wurde nicht gefunden.');
    }

    return {
      id: band.id,
      name: band.name,
      description: band.description,
      imgUuid: band.imgUuid,
      imgExt: band.imgExt,
      status: band.status,
      userId: band.user.id
    };
  }

  @Get('user-bands')
  @Security('jwt')
  @Response(200, 'Bands where found')
  async getBandsForUser(
    @Request() req: ExpressRequest
  ) {

    const { userId } = req.user!;

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: { bands: true }
    });

    return user!.bands;
  }

  @Post('random-bands')
  @Response(200, 'Bands where found')
  async getRandomBands(
    @Body() body: GetRandomBandsParameters
  ) {
    const bandRepo = AppDataSource.getRepository(Band);
    const trackRepo = AppDataSource.getRepository(Track);

    const bands = await bandRepo
      .createQueryBuilder('band')
      .where('band.status = :status', { status: 'active' })
      .orderBy('RANDOM()')
      .limit(body.pageSize)
      .getMany();

    for (const band of bands) {

      band.tracks = await trackRepo.find({
        where: { band: { id: band.id } },
        order: { order: 'ASC' }
      });
    }

    return bands;
  }

  @Post('list-bands')
  @Response(200, 'Bands where found')
  async getBands(
    @Body() body: GetBandsParameters
  ) {
    const bandRepo = AppDataSource.getRepository(Band);
    const trackRepo = AppDataSource.getRepository(Track);

    const bands = await bandRepo
      .createQueryBuilder('band')
      .where('band.name ILIKE :search', { search: `%${body.searchTerm}%` })
      .andWhere('band.status = :status', { status: 'active' })
      .orderBy('band.name')
      .limit(body.pageSize)
      .getMany();

    for (const band of bands) {
      band.tracks = await trackRepo.find({
        where: { band: { id: band.id } },
        order: { order: 'ASC' }
      });
    }

    return bands;

  }
}