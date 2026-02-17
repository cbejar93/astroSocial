import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UseFilters,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MulterExceptionFilter } from '../common/filters/multer-exception.filter';

const imageFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, TIFF.'), false);
};

const multerOptions = {
  fileFilter: imageFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
};

@Controller('api/articles')
export class ArticlesController {
  private readonly logger = new Logger(ArticlesController.name);

  constructor(private readonly articles: ArticlesService) {}

  // ── Admin endpoints (must be defined before /:slug) ──

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(FileInterceptor('coverImage', multerOptions))
  async create(
    @Req() req: Request & { user: { sub: string; role: string } },
    @Body() dto: CreateArticleDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.articles.create(req.user.sub, dto, coverImage);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-image')
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async uploadImage(
    @Req() req: Request & { user: { role: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    const url = await this.articles.uploadInlineImage(file);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  async findAllAdmin(
    @Req() req: Request & { user: { role: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.articles.findAllAdmin(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  async findByIdAdmin(
    @Req() req: Request & { user: { role: string } },
    @Param('id') id: string,
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.articles.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(FileInterceptor('coverImage', multerOptions))
  async update(
    @Req() req: Request & { user: { role: string } },
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.articles.update(id, dto, coverImage);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Req() req: Request & { user: { role: string } },
    @Param('id') id: string,
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.articles.delete(id);
  }

  // ── Public endpoints ──

  @Get()
  async findAllPublished(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.articles.findAllPublished(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 10,
    );
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.articles.findBySlug(slug);
  }
}
