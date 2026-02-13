import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LoungesController } from './lounges.controller';
import { LoungesService } from './lounges.service';
import { PostsService } from '../posts/post.service';

describe('LoungesController', () => {
  let controller: LoungesController;
  let lounges: {
    create: jest.Mock;
    findAll: jest.Mock;
    findByName: jest.Mock;
    follow: jest.Mock;
    unfollow: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let posts: { getLoungePosts: jest.Mock; create: jest.Mock };

  beforeEach(() => {
    lounges = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    posts = {
      getLoungePosts: jest.fn(),
      create: jest.fn(),
    };
    controller = new LoungesController(
      lounges as unknown as LoungesService,
      posts as unknown as PostsService,
    );
  });

  const adminReq = { user: { sub: 'u1', role: 'ADMIN' } } as any;
  const userReq = { user: { sub: 'u1', role: 'USER' } } as any;

  describe('createLounge', () => {
    it('delegates to lounges.create with dto and files', async () => {
      lounges.create.mockResolvedValue({ id: 'l1' });
      const files = { profile: [{}], banner: [{}] } as any;

      const result = await controller.createLounge(
        { name: 'space', description: 'desc' },
        files,
      );
      expect(lounges.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'l1' });
    });
  });

  describe('getLounges', () => {
    it('delegates to lounges.findAll', async () => {
      lounges.findAll.mockResolvedValue([]);

      const result = await controller.getLounges();
      expect(result).toEqual([]);
    });
  });

  describe('getLounge', () => {
    it('returns lounge when found by name', async () => {
      lounges.findByName.mockResolvedValue({ id: 'l1', name: 'space' });

      const result = await controller.getLounge('space');
      expect(result).toEqual({ id: 'l1', name: 'space' });
    });

    it('throws NotFoundException when lounge not found', async () => {
      lounges.findByName.mockResolvedValue(null);

      await expect(controller.getLounge('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getLoungePosts', () => {
    it('looks up lounge by name, then delegates to posts.getLoungePosts', async () => {
      lounges.findByName.mockResolvedValue({ id: 'l1' });
      posts.getLoungePosts.mockResolvedValue({ posts: [], total: 0 });

      const result = await controller.getLoungePosts(
        'space',
        { user: { sub: 'u1' } } as any,
        '1',
        '20',
      );
      expect(posts.getLoungePosts).toHaveBeenCalledWith('l1', 'u1', 1, 20);
      expect(result).toEqual({ posts: [], total: 0 });
    });

    it('throws NotFoundException when lounge not found', async () => {
      lounges.findByName.mockResolvedValue(null);

      await expect(
        controller.getLoungePosts('missing', userReq, '1', '20'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('followLounge / unfollowLounge', () => {
    it('delegates to lounges.follow', async () => {
      lounges.findByName.mockResolvedValue({ id: 'l1' });
      lounges.follow.mockResolvedValue({});

      const result = await controller.followLounge('space', userReq);
      expect(lounges.follow).toHaveBeenCalledWith('l1', 'u1');
      expect(result).toEqual({ success: true });
    });

    it('delegates to lounges.unfollow', async () => {
      lounges.findByName.mockResolvedValue({ id: 'l1' });
      lounges.unfollow.mockResolvedValue({});

      const result = await controller.unfollowLounge('space', userReq);
      expect(lounges.unfollow).toHaveBeenCalledWith('l1', 'u1');
      expect(result).toEqual({ success: true });
    });

    it('throws NotFoundException for follow when lounge not found', async () => {
      lounges.findByName.mockResolvedValue(null);

      await expect(
        controller.followLounge('missing', userReq),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateLounge', () => {
    it('delegates to lounges.update when user is ADMIN', async () => {
      lounges.update.mockResolvedValue({ id: 'l1' });
      const files = { profile: undefined, banner: undefined } as any;

      const result = await controller.updateLounge('l1', adminReq, { name: 'updated' }, files);
      expect(lounges.update).toHaveBeenCalledWith('l1', { name: 'updated' }, undefined, undefined);
      expect(result).toEqual({ id: 'l1' });
    });

    it('throws ForbiddenException when user is not ADMIN', async () => {
      const files = { profile: undefined, banner: undefined } as any;

      await expect(
        controller.updateLounge('l1', userReq, { name: 'updated' }, files),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('deleteLounge', () => {
    it('delegates to lounges.remove when user is ADMIN', async () => {
      lounges.remove.mockResolvedValue({});

      const result = await controller.deleteLounge('l1', adminReq);
      expect(lounges.remove).toHaveBeenCalledWith('l1');
      expect(result).toEqual({ success: true });
    });

    it('throws ForbiddenException when user is not ADMIN', async () => {
      await expect(
        controller.deleteLounge('l1', userReq),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
