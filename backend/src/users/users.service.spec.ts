import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UsersService } from './users.service';
import { SocialPlatform, TemperatureUnit, AccentColor } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    userSocialAccount: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    post: { findMany: jest.Mock; deleteMany: jest.Mock };
    comment: { findMany: jest.Mock; deleteMany: jest.Mock };
    commentLike: { deleteMany: jest.Mock };
    postInteraction: { deleteMany: jest.Mock };
    notification: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
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
        delete: jest.fn(),
      },
      userSocialAccount: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      post: { findMany: jest.fn(), deleteMany: jest.fn() },
      comment: { findMany: jest.fn(), deleteMany: jest.fn() },
      commentLike: { deleteMany: jest.fn() },
      postInteraction: { deleteMany: jest.fn() },
      notification: { deleteMany: jest.fn() },
      $transaction: jest.fn((args: unknown) =>
        Array.isArray(args) ? Promise.all(args) : (args as Function)(prisma),
      ),
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
      temperature: TemperatureUnit.F,
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

  describe('addSocialAccount', () => {
    const baseAccount = {
      id: 'social-1',
      userId: 'user-123',
      platform: SocialPlatform.INSTAGRAM,
      url: 'https://instagram.com/example',
      metadata: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    it('creates a social account for a valid platform and url', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.userSocialAccount.create.mockResolvedValue(baseAccount);

      const result = await service.addSocialAccount('user-123', {
        platform: SocialPlatform.INSTAGRAM,
        url: 'https://instagram.com/example',
      });

      expect(prisma.userSocialAccount.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          platform: SocialPlatform.INSTAGRAM,
          url: 'https://instagram.com/example',
          metadata: undefined,
        },
      });
      expect(result.platform).toBe(SocialPlatform.INSTAGRAM);
    });

    it('rejects unsupported platforms', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

      await expect(
        service.addSocialAccount('user-123', {
          platform: 'invalid',
          url: 'https://example.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid URLs', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

      await expect(
        service.addSocialAccount('user-123', {
          platform: SocialPlatform.GITHUB,
          url: 'not-a-url',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws conflict when a social account is duplicated', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      prisma.userSocialAccount.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.addSocialAccount('user-123', {
          platform: SocialPlatform.GITHUB,
          url: 'https://github.com/example',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws not found when the user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addSocialAccount('user-123', {
          platform: SocialPlatform.GITHUB,
          url: 'https://github.com/example',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteSocialAccount', () => {
    it('deletes a social account owned by the user', async () => {
      prisma.userSocialAccount.findUnique.mockResolvedValue({
        id: 'social-1',
        userId: 'user-123',
      });

      await service.deleteSocialAccount('user-123', 'social-1');

      expect(prisma.userSocialAccount.delete).toHaveBeenCalledWith({
        where: { id: 'social-1' },
      });
    });

    it('throws not found when the social account does not exist', async () => {
      prisma.userSocialAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteSocialAccount('user-123', 'social-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws not found when the social account belongs to another user', async () => {
      prisma.userSocialAccount.findUnique.mockResolvedValue({
        id: 'social-1',
        userId: 'user-999',
      });

      await expect(
        service.deleteSocialAccount('user-123', 'social-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findById', () => {
    it('returns UserDto when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        username: 'alice',
        avatarUrl: 'a.png',
        bio: 'hello',
        profileComplete: true,
        role: 'USER',
        temperature: TemperatureUnit.F,
        accent: AccentColor.BRAND,
        followedLounges: [],
        followers: [],
        following: [],
      });

      const result = await service.findById('user-123');
      expect(result.id).toBe('user-123');
      expect(result.username).toBe('alice');
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByUsername', () => {
    it('returns UserDto when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        username: 'alice',
        avatarUrl: null,
        profileComplete: true,
        role: 'USER',
        temperature: TemperatureUnit.C,
        followedLounges: [],
        followers: [],
        following: [],
      });

      const result = await service.findByUsername('alice');
      expect(result.id).toBe('user-123');
    });

    it('throws NotFoundException when username not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByUsername('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateTemperaturePreference', () => {
    it('updates temperature to C', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'user-123',
        username: 'alice',
        profileComplete: true,
        role: 'USER',
        temperature: TemperatureUnit.C,
        followedLounges: [],
        followers: [],
        following: [],
      });

      const result = await service.updateTemperaturePreference('user-123', 'c');
      expect(result.temperature).toBe(TemperatureUnit.C);
    });

    it('throws BadRequestException for invalid unit', async () => {
      await expect(
        service.updateTemperaturePreference('user-123', 'kelvin'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateBio', () => {
    it('updates bio with valid text', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'user-123',
        username: 'alice',
        bio: 'My bio',
        profileComplete: true,
        role: 'USER',
        temperature: TemperatureUnit.F,
        followedLounges: [],
        followers: [],
        following: [],
      });

      const result = await service.updateBio('user-123', 'My bio');
      expect(result.bio).toBe('My bio');
    });

    it('throws BadRequestException when bio exceeds 400 words', async () => {
      const longBio = Array(401).fill('word').join(' ');

      await expect(
        service.updateBio('user-123', longBio),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateAccentPreference', () => {
    it('updates accent to OCEAN', async () => {
      prisma.user.update.mockResolvedValue({
        id: 'user-123',
        username: 'alice',
        profileComplete: true,
        role: 'USER',
        temperature: TemperatureUnit.F,
        accent: AccentColor.OCEAN,
        followedLounges: [],
        followers: [],
        following: [],
      });

      const result = await service.updateAccentPreference('user-123', 'ocean');
      expect(result.accent).toBe(AccentColor.OCEAN);
    });

    it('throws BadRequestException for invalid accent', async () => {
      await expect(
        service.updateAccentPreference('user-123', 'red'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('followUser / unfollowUser', () => {
    it('connects follower to target user', async () => {
      prisma.user.update.mockResolvedValue({});

      await service.followUser('target-1', 'follower-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'follower-1' },
        data: { following: { connect: { id: 'target-1' } } },
      });
    });

    it('disconnects follower from target user', async () => {
      prisma.user.update.mockResolvedValue({});

      await service.unfollowUser('target-1', 'follower-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'follower-1' },
        data: { following: { disconnect: { id: 'target-1' } } },
      });
    });
  });

  describe('deleteUser', () => {
    it('executes cascading deletion transaction', async () => {
      await service.deleteUser('user-123');
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
