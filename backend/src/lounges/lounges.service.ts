import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateLoungeDto } from './dto/create-lounge.dto';
import { Lounge } from '@prisma/client';

@Injectable()
export class LoungesService {
  private readonly logger = new Logger(LoungesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(
    dto: CreateLoungeDto,
    profile?: Express.Multer.File,
    banner?: Express.Multer.File,
  ): Promise<Lounge> {
    this.logger.log(`Creating lounge ${dto.name}`);

    let profileUrl: string | undefined;
    let bannerUrl: string | undefined;

    try {
      if (profile) {
        profileUrl = await this.storage.uploadFile(
          'avatars',
          `lounges/${Date.now()}_${profile.originalname}`,
          profile,
        );
      }
      if (banner) {
        bannerUrl = await this.storage.uploadFile(
          'posts',
          `lounges/${Date.now()}_${banner.originalname}`,
          banner,
        );
      }
    } catch (err: any) {
      this.logger.error('Failed to upload lounge images', err.stack);
      throw new InternalServerErrorException('Could not upload lounge images');
    }

    try {
      const lounge = await this.prisma.lounge.create({
        data: {
          name: dto.name,
          description: dto.description,
          bannerUrl: bannerUrl ?? '',
          profileUrl: profileUrl ?? '',
        },
      });
      this.logger.log(`Lounge created with id=${lounge.id}`);
      return lounge;
    } catch (err: any) {
      this.logger.error('Failed to create lounge record', err.stack);
      throw new InternalServerErrorException('Could not create lounge');
    }
  }

  async findAll(): Promise<Lounge[]> {
    return this.prisma.lounge.findMany();
  }
}
