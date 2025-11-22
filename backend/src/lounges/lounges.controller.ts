import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Logger,
  Param,
  Req,
  UseGuards,
  Query,
  Delete,
  Patch,
  NotFoundException,
  ForbiddenException,
  UseFilters,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import type { Request } from 'express';
import { LoungesService } from './lounges.service';
import { CreateLoungeDto } from './dto/create-lounge.dto';
import { UpdateLoungeDto } from './dto/update-lounge.dto';
import { PostsService } from '../posts/post.service';
import { CreatePostDto } from '../posts/dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/jwt-optional.guard';
import { MulterExceptionFilter } from '../common/filters/multer-exception.filter';

@Controller('api/lounges')
export class LoungesController {
  private readonly logger = new Logger(LoungesController.name);

  constructor(
    private readonly lounges: LoungesService,
    private readonly posts: PostsService,
  ) {}

  @Post()
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      {
        fileFilter: (_req, file, cb) => {
          const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
          if (allowed.includes(file.mimetype)) cb(null, true);
          else
            cb(
              new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, TIFF.'),
              false,
            );
        },
        limits: { fileSize: 100 * 1024 * 1024 },
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

  @UseGuards(OptionalAuthGuard)
  @Get(':name/posts')
  async getLoungePosts(
    @Param('name') name: string,
    @Req() req: Request & { user?: { sub: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const userId = req.user ? req.user.sub : null;
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    const lounge = await this.lounges.findByName(name);
    if (!lounge) throw new NotFoundException('Lounge not found');
    return this.posts.getLoungePosts(lounge.id, userId, p, l);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':name/posts')
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(
    FilesInterceptor('images', 4, {
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else
          cb(
            new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, TIFF.'),
            false,
          );
      },
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  async createLoungePost(
    @Param('name') name: string,
    @Req() req: Request & { user: { sub: string } },
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreatePostDto,
  ) {
    const file = files?.[0];
    const lounge = await this.lounges.findByName(name);
    if (!lounge) throw new NotFoundException('Lounge not found');
    return this.posts.create(
      req.user.sub,
      { ...dto, loungeId: lounge.id },
      file,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':name/follow')
  async followLounge(
    @Param('name') name: string,
    @Req() req: Request & { user: { sub: string; role: string } },
  ) {
    const lounge = await this.lounges.findByName(name);
    if (!lounge) throw new NotFoundException('Lounge not found');
    await this.lounges.follow(lounge.id, req.user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':name/follow')
  async unfollowLounge(
    @Param('name') name: string,
    @Req() req: Request & { user: { sub: string; role: string } },
  ) {
    const lounge = await this.lounges.findByName(name);
    if (!lounge) throw new NotFoundException('Lounge not found');
    await this.lounges.unfollow(lounge.id, req.user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      {
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else
          cb(
            new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, TIFF.'),
            false,
          );
      },
        limits: { fileSize: 100 * 1024 * 1024 },
      },
    ),
  )
  async updateLounge(
    @Param('id') id: string,
    @Req() req: Request & { user: { role: string } },
    @Body() dto: UpdateLoungeDto,
    @UploadedFiles()
    files: {
      profile?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    const profile = files.profile?.[0];
    const banner = files.banner?.[0];
    return this.lounges.update(id, dto, profile, banner);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteLounge(
    @Param('id') id: string,
    @Req() req: Request & { user: { role: string } },
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    await this.lounges.remove(id);
    return { success: true };
  }

  @Get(':name')
  async getLounge(@Param('name') name: string) {
    const lounge = await this.lounges.findByName(name);
    if (!lounge) throw new NotFoundException('Lounge not found');
    return lounge;
  }
}
