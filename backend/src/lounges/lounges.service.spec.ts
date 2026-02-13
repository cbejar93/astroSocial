import { InternalServerErrorException } from '@nestjs/common';
import { LoungesService } from './lounges.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { createMockPrisma, createMockStorage } from '../test-utils/mocks';

describe('LoungesService', () => {
  let service: LoungesService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    prisma = createMockPrisma();
    storage = createMockStorage();
    service = new LoungesService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
    );
  });

  describe('create', () => {
    it('creates a lounge without images', async () => {
      const lounge = { id: 'l1', name: 'space', description: 'desc' };
      prisma.lounge.create.mockResolvedValue(lounge);

      const result = await service.create({ name: 'space', description: 'desc' });
      expect(result).toEqual(lounge);
      expect(storage.uploadFile).not.toHaveBeenCalled();
    });

    it('creates a lounge with profile and banner images', async () => {
      storage.uploadFile
        .mockResolvedValueOnce('profile-url')
        .mockResolvedValueOnce('banner-url');
      prisma.lounge.create.mockResolvedValue({ id: 'l1' });

      const profile = { originalname: 'p.png' } as Express.Multer.File;
      const banner = { originalname: 'b.png' } as Express.Multer.File;

      await service.create({ name: 'space', description: 'desc' }, profile, banner);
      expect(storage.uploadFile).toHaveBeenCalledTimes(2);
      expect(prisma.lounge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            profileUrl: 'profile-url',
            bannerUrl: 'banner-url',
          }),
        }),
      );
    });

    it('throws InternalServerErrorException when image upload fails', async () => {
      storage.uploadFile.mockRejectedValue(new Error('upload fail'));
      const profile = { originalname: 'p.png' } as Express.Multer.File;

      await expect(
        service.create({ name: 'space', description: 'desc' }, profile),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when prisma create fails', async () => {
      prisma.lounge.create.mockRejectedValue(new Error('db fail'));

      await expect(
        service.create({ name: 'space', description: 'desc' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('returns all lounges with post/follower counts', async () => {
      prisma.lounge.findMany.mockResolvedValue([
        {
          id: 'l1',
          name: 'space',
          description: 'desc',
          bannerUrl: 'b.png',
          profileUrl: 'p.png',
          _count: { posts: 5, followers: 3 },
          posts: [{ createdAt: new Date('2024-06-01') }],
        },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].threads).toBe(5);
      expect(result[0].followers).toBe(3);
      expect(result[0].lastPostAt).toEqual(new Date('2024-06-01'));
    });
  });

  describe('findByName', () => {
    it('returns lounge data when found', async () => {
      prisma.lounge.findUnique.mockResolvedValue({
        id: 'l1',
        name: 'space',
        description: 'desc',
        bannerUrl: 'b.png',
        profileUrl: 'p.png',
        _count: { posts: 2, followers: 1 },
        posts: [],
      });

      const result = await service.findByName('space');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('space');
      expect(result!.lastPostAt).toBeNull();
    });

    it('returns null when lounge not found', async () => {
      prisma.lounge.findUnique.mockResolvedValue(null);

      const result = await service.findByName('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('follow / unfollow', () => {
    it('connects user to lounge via prisma update', async () => {
      prisma.user.update.mockResolvedValue({});

      await service.follow('l1', 'u1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { followedLounges: { connect: { id: 'l1' } } },
      });
    });

    it('disconnects user from lounge via prisma update', async () => {
      prisma.user.update.mockResolvedValue({});

      await service.unfollow('l1', 'u1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { followedLounges: { disconnect: { id: 'l1' } } },
      });
    });
  });

  describe('update', () => {
    it('updates lounge fields and images', async () => {
      storage.uploadFile.mockResolvedValue('new-banner-url');
      prisma.lounge.update.mockResolvedValue({ id: 'l1' });

      const banner = { originalname: 'b.png' } as Express.Multer.File;
      const result = await service.update(
        'l1',
        { name: 'updated' },
        undefined,
        banner,
      );
      expect(prisma.lounge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'updated',
            bannerUrl: 'new-banner-url',
          }),
        }),
      );
      expect(result).toEqual({ id: 'l1' });
    });

    it('throws InternalServerErrorException on failure', async () => {
      prisma.lounge.update.mockRejectedValue(new Error('db fail'));

      await expect(
        service.update('l1', { name: 'updated' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('deletes lounge and all associated data in transaction', async () => {
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.remove('l1');
      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException on failure', async () => {
      prisma.$transaction.mockRejectedValue(new Error('db fail'));

      await expect(service.remove('l1')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('searchLounges', () => {
    it('returns paginated search results', async () => {
      prisma.$transaction.mockResolvedValue([
        [{ id: 'l1', name: 'space', bannerUrl: 'b.png' }],
        1,
      ]);

      const result = await service.searchLounges('spa', 1, 20);
      expect(result).toEqual({
        results: [{ id: 'l1', name: 'space', bannerUrl: 'b.png' }],
        total: 1,
        page: 1,
        limit: 20,
      });
    });
  });
});
