import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Logger,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { LoungesService } from './lounges.service';
import { CreateLoungeDto } from './dto/create-lounge.dto';

@Controller('api/lounges')
export class LoungesController {
  private readonly logger = new Logger(LoungesController.name);

  constructor(private readonly lounges: LoungesService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      {
        fileFilter: (_req, file, cb) => {
          const allowed = ['image/jpeg', 'image/png', 'image/gif'];
          if (allowed.includes(file.mimetype)) cb(null, true);
          else cb(new Error('Invalid file type'), false);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  async createLounge(
    @Body() dto: CreateLoungeDto,
    @UploadedFiles()
    files: {
      profile?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ) {
    const profile = files.profile?.[0];
    const banner = files.banner?.[0];
    this.logger.log(`Creating lounge ${dto.name}`);
    return this.lounges.create(dto, profile, banner);
  }

  @Get()
  async getLounges() {
    return this.lounges.findAll();
  }
}
