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

  async findAll() {
    console.log('is this not hit at all?')
    this.logger.log('Fetching all lounges');
    const lounges = await this.prisma.lounge.findMany({
      include: {
        _count: { select: { posts: true } },
        posts: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    this.logger.log(`Found ${lounges.length} lounges`);
    return lounges.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      bannerUrl: l.bannerUrl,
      profileUrl: l.profileUrl,
      threads: l._count.posts,
      views: 0,
      lastPostAt: l.posts[0]?.createdAt ?? null,
    }));
  }

  async findByName(name: string) {
    this.logger.log(`Fetching lounge by name=${name}`);
    const lounge = await this.prisma.lounge.findUnique({
      where: { name },
      include: {
        _count: { select: { posts: true } },
        posts: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!lounge) {
      this.logger.warn(`Lounge not found with name=${name}`);
      return null;
    }

    this.logger.log(`Found lounge id=${lounge.id} for name=${name}`);
    return {
      id: lounge.id,
      name: lounge.name,
      description: lounge.description,
      bannerUrl: lounge.bannerUrl,
      profileUrl: lounge.profileUrl,
      threads: lounge._count.posts,
      views: 0,
      lastPostAt: lounge.posts[0]?.createdAt ?? null,
    };
  }

  async follow(loungeId: string, userId: string) {
    this.logger.log(`User ${userId} following lounge ${loungeId}`);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        followedLounges: {
          connect: { id: loungeId },
        },
      },
    });
  }

  async unfollow(loungeId: string, userId: string) {
    this.logger.log(`User ${userId} unfollowing lounge ${loungeId}`);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        followedLounges: {
          disconnect: { id: loungeId },
        },
      },
    });
  }
}
