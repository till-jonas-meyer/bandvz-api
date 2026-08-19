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
import { User } from '../../entities/user/User';
import { HttpError } from '../../httpError';
import { uploadBandImageMiddleware } from '../../middleware/upload';
import type { ErrorResponse } from '../../httpError';
import fs from 'fs/promises';

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

    const savedBand = await bandRepo.save(newBand);

    return { bandId: savedBand.id };
  };

  @Put('test')
  @Middlewares(uploadBandImageMiddleware)
  @Consumes('multipart/form-data')
  test(
    @FormField() message: string,
    @UploadedFile() testFile?: Express.Multer.File
  ) {
    return { message };
  }

  @Put('update/{bandId}')
  @Security('jwt')
  @Middlewares(uploadBandImageMiddleware)
  @Consumes('multipart/form-data')
  @SuccessResponse(200, 'Band was updated')
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
        await fs.unlink(`storage/bandimgs/${band.imgUuid}.png`);
      }
      band.imgUuid = null;
      bandRepo.save(band);
    }

    if (imageAction === 'replace') {

      // Remove existing file
      if (band.imgUuid) {
        await fs.unlink(`storage/bandimgs/${band.imgUuid}.png`);
      }

      if (!req?.file) {
        throw new HttpError(400, 'Bad reqeust');
      }

      // Store new imgUuid
      const newUuid = req.file.filename.split('.')[0]!;
      band.imgUuid = newUuid;
      bandRepo.save(band);
    }

    band.name = name;
    band.description = description;
    band.status = BandStatus.active;
    bandRepo.save(band);

    return { message: 'Band wurde aktualisiert.' };
  };

}