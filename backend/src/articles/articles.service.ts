import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
  }

  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      const suffix = Math.random().toString(36).substring(2, 8);
      return `${slug}-${suffix}`;
    }
    return slug;
  }

  async create(
    userId: string,
    dto: CreateArticleDto,
    coverImage?: Express.Multer.File,
  ) {
    this.logger.log(`Creating article: ${dto.title}`);

    let coverImageUrl: string | undefined;
    if (coverImage) {
      try {
        coverImageUrl = await this.storage.uploadFile(
          'posts',
          `articles/${Date.now()}_${coverImage.originalname}`,
          coverImage,
        );
      } catch (err: unknown) {
        this.logger.error('Failed to upload cover image', (err as Error).stack);
        throw new InternalServerErrorException('Could not upload cover image');
      }
    }

    const baseSlug = dto.slug ? this.generateSlug(dto.slug) : this.generateSlug(dto.title);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const status = dto.status ?? 'DRAFT';

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        body: dto.body,
        excerpt: dto.excerpt,
        coverImageUrl,
        status,
        authorId: userId,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    this.logger.log(`Article created id=${article.id} slug=${article.slug}`);
    return article;
  }

  async update(
    id: string,
    dto: UpdateArticleDto,
    coverImage?: Express.Multer.File,
  ) {
    this.logger.log(`Updating article id=${id}`);

    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');

    let coverImageUrl: string | undefined;
    if (coverImage) {
      try {
        coverImageUrl = await this.storage.uploadFile(
          'posts',
          `articles/${Date.now()}_${coverImage.originalname}`,
          coverImage,
        );
      } catch (err: unknown) {
        this.logger.error('Failed to upload cover image', (err as Error).stack);
        throw new InternalServerErrorException('Could not upload cover image');
      }
    }

    let slug: string | undefined;
    if (dto.slug) {
      slug = await this.ensureUniqueSlug(this.generateSlug(dto.slug), id);
    } else if (dto.title && dto.title !== existing.title) {
      slug = await this.ensureUniqueSlug(this.generateSlug(dto.title), id);
    }

    const isPublishing =
      dto.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(slug ? { slug } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt } : {}),
        ...(coverImageUrl ? { coverImageUrl } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(isPublishing ? { publishedAt: new Date() } : {}),
      },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    this.logger.log(`Article updated id=${article.id}`);
    return article;
  }

  async delete(id: string) {
    this.logger.log(`Deleting article id=${id}`);
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');

    await this.prisma.article.delete({ where: { id } });
    this.logger.log(`Article deleted id=${id}`);
    return { success: true };
  }

  async findAllPublished(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { username: true, avatarUrl: true } },
        },
      }),
      this.prisma.article.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return { articles, total, page, limit };
  }

  async findAllAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [articles, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { username: true, avatarUrl: true } },
        },
      }),
      this.prisma.article.count(),
    ]);

    return { articles, total, page, limit };
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    if (!article || article.status !== 'PUBLISHED') {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async findById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { username: true, avatarUrl: true } },
      },
    });

    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async uploadInlineImage(file: Express.Multer.File): Promise<string> {
    this.logger.log('Uploading inline article image');
    try {
      const url = await this.storage.uploadFile(
        'posts',
        `articles/inline/${Date.now()}_${file.originalname}`,
        file,
      );
      return url;
    } catch (err: unknown) {
      this.logger.error('Failed to upload inline image', (err as Error).stack);
      throw new InternalServerErrorException('Could not upload image');
    }
  }
}
