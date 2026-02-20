import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { createMockPrisma, createMockStorage } from '../test-utils/mocks';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let storage: ReturnType<typeof createMockStorage>;

  const baseArticle = {
    id: 'a1',
    title: 'Test Article',
    slug: 'test-article',
    body: 'body',
    excerpt: 'excerpt',
    coverImageUrl: null,
    status: 'DRAFT',
    authorId: 'u1',
    publishedAt: null,
    author: { username: 'alice', avatarUrl: null },
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    storage = createMockStorage();
    service = new ArticlesService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );
  });

  describe('create', () => {
    it('creates an article without a cover image', async () => {
      prisma.article.findUnique.mockResolvedValue(null);
      prisma.article.create.mockResolvedValue(baseArticle);

      const result = await service.create('u1', { title: 'Test Article', body: 'body' });

      expect(result).toEqual(baseArticle);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('creates an article with a cover image', async () => {
      storage.uploadFile.mockResolvedValue('https://cdn.example.com/cover.png');
      prisma.article.findUnique.mockResolvedValue(null);
      prisma.article.create.mockResolvedValue({
        ...baseArticle,
        coverImageUrl: 'https://cdn.example.com/cover.png',
      });

      const file = { originalname: 'cover.png' } as Express.Multer.File;
      const result = await service.create('u1', { title: 'Test Article', body: 'body' }, file);

      expect(storage.uploadFile).toHaveBeenCalledWith(
        'posts',
        expect.stringMatching(/^articles\/\d+_cover\.png$/),
        file,
      );
      expect(result.coverImageUrl).toBe('https://cdn.example.com/cover.png');
    });

    it('throws InternalServerErrorException when cover image upload fails', async () => {
      storage.uploadFile.mockRejectedValue(new Error('upload fail'));
      const file = { originalname: 'cover.png' } as Express.Multer.File;

      await expect(
        service.create('u1', { title: 'Test Article', body: 'body' }, file),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('uses a custom slug when provided', async () => {
      prisma.article.findUnique.mockResolvedValue(null);
      prisma.article.create.mockResolvedValue({ ...baseArticle, slug: 'my-custom-slug' });

      await service.create('u1', { title: 'Test Article', body: 'body', slug: 'My Custom Slug' });

      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'my-custom-slug' }),
        }),
      );
    });

    it('sets publishedAt when status is PUBLISHED', async () => {
      prisma.article.findUnique.mockResolvedValue(null);
      prisma.article.create.mockResolvedValue({ ...baseArticle, status: 'PUBLISHED' });

      await service.create('u1', { title: 'Test Article', body: 'body', status: 'PUBLISHED' });

      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PUBLISHED',
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('appends a random suffix when the slug already exists', async () => {
      prisma.article.findUnique.mockResolvedValue({ id: 'other-article', slug: 'test-article' });
      prisma.article.create.mockResolvedValue(baseArticle);

      await service.create('u1', { title: 'Test Article', body: 'body' });

      const createCall = prisma.article.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^test-article-.+$/);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when article does not exist', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(service.update('a1', { title: 'Updated' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('updates article fields without a new cover image', async () => {
      prisma.article.findUnique.mockResolvedValue(baseArticle);
      prisma.article.update.mockResolvedValue({ ...baseArticle, title: 'Updated' });

      const result = await service.update('a1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('uploads a new cover image on update', async () => {
      prisma.article.findUnique.mockResolvedValue(baseArticle);
      storage.uploadFile.mockResolvedValue('https://cdn.example.com/new-cover.png');
      prisma.article.update.mockResolvedValue({
        ...baseArticle,
        coverImageUrl: 'https://cdn.example.com/new-cover.png',
      });

      const file = { originalname: 'new-cover.png' } as Express.Multer.File;
      await service.update('a1', {}, file);

      expect(storage.uploadFile).toHaveBeenCalledWith(
        'posts',
        expect.stringMatching(/^articles\/\d+_new-cover\.png$/),
        file,
      );
    });

    it('throws InternalServerErrorException when cover image upload fails on update', async () => {
      prisma.article.findUnique.mockResolvedValue(baseArticle);
      storage.uploadFile.mockRejectedValue(new Error('upload fail'));
      const file = { originalname: 'cover.png' } as Express.Multer.File;

      await expect(service.update('a1', {}, file)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('sets publishedAt when transitioning to PUBLISHED', async () => {
      prisma.article.findUnique.mockResolvedValue({ ...baseArticle, status: 'DRAFT' });
      prisma.article.update.mockResolvedValue({ ...baseArticle, status: 'PUBLISHED' });

      await service.update('a1', { status: 'PUBLISHED' });

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PUBLISHED',
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('does not set publishedAt when article is already PUBLISHED', async () => {
      prisma.article.findUnique.mockResolvedValue({ ...baseArticle, status: 'PUBLISHED' });
      prisma.article.update.mockResolvedValue({ ...baseArticle, status: 'PUBLISHED' });

      await service.update('a1', { status: 'PUBLISHED' });

      const updateCall = prisma.article.update.mock.calls[0][0];
      expect(updateCall.data.publishedAt).toBeUndefined();
    });

    it('regenerates slug when title changes', async () => {
      prisma.article.findUnique
        .mockResolvedValueOnce({ ...baseArticle })
        .mockResolvedValueOnce(null);
      prisma.article.update.mockResolvedValue(baseArticle);

      await service.update('a1', { title: 'Brand New Title' });

      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'brand-new-title' }),
        }),
      );
    });
  });

  describe('delete', () => {
    it('deletes an existing article', async () => {
      prisma.article.findUnique.mockResolvedValue(baseArticle);
      prisma.article.delete.mockResolvedValue(baseArticle);

      const result = await service.delete('a1');

      expect(prisma.article.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
      expect(result).toEqual({ success: true });
    });

    it('throws NotFoundException when article does not exist', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.article.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAllPublished', () => {
    it('returns paginated published articles', async () => {
      prisma.$transaction.mockResolvedValue([[baseArticle], 1]);

      const result = await service.findAllPublished(1, 10);

      expect(result).toEqual({ articles: [baseArticle], total: 1, page: 1, limit: 10 });
    });

    it('calls $transaction for page 2', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAllPublished(2, 5);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findAllAdmin', () => {
    it('returns all articles including drafts', async () => {
      const draftArticle = { ...baseArticle, status: 'DRAFT' };
      prisma.$transaction.mockResolvedValue([[draftArticle], 1]);

      const result = await service.findAllAdmin(1, 20);

      expect(result).toEqual({ articles: [draftArticle], total: 1, page: 1, limit: 20 });
    });
  });

  describe('findBySlug', () => {
    it('returns a published article by slug', async () => {
      prisma.article.findUnique.mockResolvedValue({ ...baseArticle, status: 'PUBLISHED' });

      const result = await service.findBySlug('test-article');

      expect(result.slug).toBe('test-article');
    });

    it('throws NotFoundException for a draft article', async () => {
      prisma.article.findUnique.mockResolvedValue({ ...baseArticle, status: 'DRAFT' });

      await expect(service.findBySlug('test-article')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when slug not found', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findById', () => {
    it('returns an article by id', async () => {
      prisma.article.findUnique.mockResolvedValue(baseArticle);

      const result = await service.findById('a1');

      expect(result.id).toBe('a1');
    });

    it('throws NotFoundException when id not found', async () => {
      prisma.article.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('searchArticles', () => {
    it('returns paginated search results', async () => {
      const item = { id: 'a1', title: 'Test Article', slug: 'test-article', coverImageUrl: null };
      prisma.$transaction.mockResolvedValue([[item], 1]);

      const result = await service.searchArticles('Test', 1, 20);

      expect(result).toEqual({ results: [item], total: 1, page: 1, limit: 20 });
    });

    it('returns empty results when nothing matches', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.searchArticles('nomatch', 1, 20);

      expect(result).toEqual({ results: [], total: 0, page: 1, limit: 20 });
    });
  });

  describe('uploadInlineImage', () => {
    it('uploads an inline image and returns the url', async () => {
      storage.uploadFile.mockResolvedValue('https://cdn.example.com/inline.png');
      const file = { originalname: 'inline.png' } as Express.Multer.File;

      const url = await service.uploadInlineImage(file);

      expect(storage.uploadFile).toHaveBeenCalledWith(
        'posts',
        expect.stringMatching(/^articles\/inline\/\d+_inline\.png$/),
        file,
      );
      expect(url).toBe('https://cdn.example.com/inline.png');
    });

    it('throws InternalServerErrorException when inline image upload fails', async () => {
      storage.uploadFile.mockRejectedValue(new Error('upload fail'));
      const file = { originalname: 'inline.png' } as Express.Multer.File;

      await expect(service.uploadInlineImage(file)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
