import { BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };
  let storage: { uploadFile: jest.Mock; deleteFile: jest.Mock };

  const supabase = {} as SupabaseClient;
  const file = {
    originalname: 'avatar.png',
    mimetype: 'image/png',
    buffer: Buffer.from('avatar-file'),
  } as Express.Multer.File;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    storage = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    service = new UsersService(
      supabase,
      storage as unknown as StorageService,
      prisma as unknown as PrismaService,
    );
  });

  describe('uploadAvatar', () => {
    it('deletes the existing avatar before uploading a replacement', async () => {
      const existingUrl =
        'https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar.png';
      const uploadedUrl =
        'https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar.png?v=2';

      const callOrder: string[] = [];

      prisma.user.findUnique.mockResolvedValue({
        avatarUrl: existingUrl,
      });
      storage.uploadFile.mockImplementation(() => {
        callOrder.push('upload');
        return Promise.resolve(uploadedUrl);
      });
      storage.deleteFile.mockImplementation(() => {
        callOrder.push('delete');
        return Promise.resolve();
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.uploadAvatar('user-123', file);

      expect(storage.deleteFile).toHaveBeenCalledWith(
        'avatars',
        'user-123/avatar.png',
      );
      expect(storage.uploadFile).toHaveBeenCalledWith(
        'avatars',
        'user-123/avatar.png',
        file,
      );
      expect(callOrder).toEqual(['delete', 'upload']);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatarUrl: uploadedUrl, profileComplete: true },
      });
      expect(result).toBe(uploadedUrl);
    });

    it('skips deletion when no prior avatar exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ avatarUrl: null });
      storage.uploadFile.mockResolvedValue('new-url');
      prisma.user.update.mockResolvedValue({});

      const result = await service.uploadAvatar('user-123', file);

      expect(storage.deleteFile).not.toHaveBeenCalled();
      expect(storage.uploadFile).toHaveBeenCalledWith(
        'avatars',
        'user-123/avatar.png',
        file,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatarUrl: 'new-url', profileComplete: true },
      });
      expect(result).toBe('new-url');
    });

    it('propagates deletion errors', async () => {
      prisma.user.findUnique.mockResolvedValue({
        avatarUrl:
          'https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar.png',
      });
      storage.deleteFile.mockRejectedValue(new Error('boom'));

      await expect(service.uploadAvatar('user-123', file)).rejects.toThrow(
        'boom',
      );
      expect(storage.uploadFile).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    const baseUser = {
      id: 'user-123',
      username: 'valid_user',
      avatarUrl: null,
      profileComplete: true,
      role: 'USER',
      followedLounges: [],
      followers: [],
      following: [],
    };

    it('trims and persists a valid username', async () => {
      prisma.user.update.mockResolvedValue(baseUser);

      const result = await service.updateProfile('user-123', '  valid_user  ');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { username: 'valid_user', profileComplete: true },
        include: {
          followedLounges: { select: { id: true } },
          followers: { select: { id: true } },
          following: { select: { id: true } },
        },
      });
      expect(result.username).toBe('valid_user');
    });

    it('rejects usernames that are too short', async () => {
      await expect(
        service.updateProfile('user-123', 'ab'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects usernames with invalid characters', async () => {
      await expect(
        service.updateProfile('user-123', 'bad user'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("throws a BadRequestException when the username isn't unique", async () => {
      prisma.user.update.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.updateProfile('user-123', 'duplicate'),
      ).rejects.toThrow("username's must be unique");
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });
});
