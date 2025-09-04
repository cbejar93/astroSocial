import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateLoungeDto } from './dto/create-lounge.dto';
import { UpdateLoungeDto } from './dto/update-lounge.dto';
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
    } catch (err: unknown) {
      this.logger.error('Failed to upload lounge images', (err as Error).stack);
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
    } catch (err: unknown) {
      this.logger.error('Failed to create lounge record', (err as Error).stack);
      throw new InternalServerErrorException('Could not create lounge');
    }
  }

  async findAll() {
    this.logger.log('Fetching all lounges');
    const lounges = await this.prisma.lounge.findMany({
      include: {
        _count: { select: { posts: true, followers: true } },
        posts: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
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
      followers: l._count.followers,
      lastPostAt: l.posts[0]?.createdAt ?? null,
    }));
  }

  async findByName(name: string) {
    this.logger.log(`Fetching lounge by name=${name}`);
    const lounge = await this.prisma.lounge.findUnique({
      where: { name },
      include: {
        _count: { select: { posts: true, followers: true } },
        posts: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
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
      followers: lounge._count.followers,
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

  async searchLounges(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    results: { id: string; name: string; bannerUrl: string }[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lounge.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        select: { id: true, name: true, bannerUrl: true },
        skip,
        take: limit,
      }),
      this.prisma.lounge.count({
        where: { name: { contains: query, mode: 'insensitive' } },
      }),
    ]);

    return { results: items, total, page, limit };
  }

  async update(
    id: string,
    dto: UpdateLoungeDto,
    profile?: Express.Multer.File,
    banner?: Express.Multer.File,
  ): Promise<Lounge> {
    this.logger.log(`Updating lounge ${id}`);

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
    } catch (err: unknown) {
      this.logger.error('Failed to upload lounge images', (err as Error).stack);
      throw new InternalServerErrorException('Could not upload lounge images');
    }

    try {
      const lounge = await this.prisma.lounge.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(bannerUrl ? { bannerUrl } : {}),
          ...(profileUrl ? { profileUrl } : {}),
        },
      });
      this.logger.log(`Lounge updated id=${id}`);
      return lounge;
    } catch (err: unknown) {
      this.logger.error('Failed to update lounge', (err as Error).stack);
      throw new InternalServerErrorException('Could not update lounge');
    }
  }

  async remove(id: string) {
    this.logger.log(`Deleting lounge ${id}`);
    try {
      await this.prisma.$transaction([
        this.prisma.commentLike.deleteMany({
          where: { comment: { post: { loungeId: id } } },
        }),
        this.prisma.postInteraction.deleteMany({
          where: { post: { loungeId: id } },
        }),
        this.prisma.notification.deleteMany({
          where: {
            OR: [
              { post: { loungeId: id } },
              { comment: { post: { loungeId: id } } },
            ],
          },
        }),
        this.prisma.comment.deleteMany({
          where: { post: { loungeId: id } },
        }),
        this.prisma.post.deleteMany({ where: { loungeId: id } }),
        this.prisma.lounge.delete({ where: { id } }),
      ]);
      this.logger.log(`Deleted lounge id=${id}`);
      return { success: true };
    } catch (err: unknown) {
      this.logger.error('Failed to delete lounge', (err as Error).stack);
      throw new InternalServerErrorException('Could not delete lounge');
    }
  }
}
