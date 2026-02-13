import { InternalServerErrorException } from '@nestjs/common';
import { InteractionType } from '@prisma/client';
import { PostsController } from './post.controller';
import { PostsService } from './post.service';

describe('PostsController', () => {
  let controller: PostsController;
  let service: {
    getWeightedFeed: jest.Mock;
    create: jest.Mock;
    toggleLike: jest.Mock;
    interact: jest.Mock;
    savePost: jest.Mock;
    unsavePost: jest.Mock;
    getSavedPosts: jest.Mock;
    getPostById: jest.Mock;
    deletePost: jest.Mock;
  };

  beforeEach(() => {
    service = {
      getWeightedFeed: jest.fn(),
      create: jest.fn(),
      toggleLike: jest.fn(),
      interact: jest.fn(),
      savePost: jest.fn(),
      unsavePost: jest.fn(),
      getSavedPosts: jest.fn(),
      getPostById: jest.fn(),
      deletePost: jest.fn(),
    };
    controller = new PostsController(service as unknown as PostsService);
  });

  const authReq = (userId = 'u1') =>
    ({ user: { sub: userId } }) as any;
  const optionalReq = (userId?: string) =>
    ({ user: userId ? { sub: userId } : undefined }) as any;

  describe('getFeed', () => {
    it('delegates to posts.getWeightedFeed with parsed page/limit', async () => {
      const feed = { posts: [], total: 0, page: 2, limit: 10 };
      service.getWeightedFeed.mockResolvedValue(feed);

      const result = await controller.getFeed(optionalReq('u1'), '2', '10');
      expect(service.getWeightedFeed).toHaveBeenCalledWith('u1', 2, 10);
      expect(result).toBe(feed);
    });

    it('defaults to page=1, limit=20 when not specified', async () => {
      service.getWeightedFeed.mockResolvedValue({ posts: [] });

      await controller.getFeed(optionalReq(), '1', '20');
      expect(service.getWeightedFeed).toHaveBeenCalledWith(null, 1, 20);
    });

    it('uses null userId when no auth user present', async () => {
      service.getWeightedFeed.mockResolvedValue({ posts: [] });

      await controller.getFeed(optionalReq(), '1', '20');
      expect(service.getWeightedFeed).toHaveBeenCalledWith(null, 1, 20);
    });

    it('throws InternalServerErrorException when service throws', async () => {
      service.getWeightedFeed.mockRejectedValue(new Error('db fail'));

      await expect(
        controller.getFeed(optionalReq(), '1', '20'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('createPost', () => {
    it('delegates to posts.create with userId, dto, and file', async () => {
      const post = { id: 'p1' };
      service.create.mockResolvedValue(post);
      const file = {} as Express.Multer.File;

      const result = await controller.createPost(authReq(), file, { body: 'hi' });
      expect(service.create).toHaveBeenCalledWith('u1', { body: 'hi' }, file);
      expect(result).toBe(post);
    });
  });

  describe('toggleLikePost', () => {
    it('delegates to posts.toggleLike and returns result', async () => {
      service.toggleLike.mockResolvedValue({ liked: true, count: 5 });

      const result = await controller.toggleLikePost(authReq(), 'p1');
      expect(service.toggleLike).toHaveBeenCalledWith('u1', 'p1');
      expect(result).toEqual({ liked: true, count: 5 });
    });
  });

  describe('sharePost', () => {
    it('delegates to posts.interact with SHARE type', async () => {
      service.interact.mockResolvedValue({ type: InteractionType.SHARE, count: 2 });

      const result = await controller.sharePost(authReq(), 'p1');
      expect(service.interact).toHaveBeenCalledWith('u1', 'p1', InteractionType.SHARE);
      expect(result.count).toBe(2);
    });
  });

  describe('repostPost', () => {
    it('delegates to posts.interact with REPOST type', async () => {
      service.interact.mockResolvedValue({ type: InteractionType.REPOST, count: 1 });

      const result = await controller.repostPost(authReq(), 'p1');
      expect(service.interact).toHaveBeenCalledWith('u1', 'p1', InteractionType.REPOST);
      expect(result.count).toBe(1);
    });
  });

  describe('savePost / unsavePost', () => {
    it('delegates to posts.savePost', async () => {
      service.savePost.mockResolvedValue({ saved: true, count: 3 });

      const result = await controller.savePost(authReq(), 'p1');
      expect(service.savePost).toHaveBeenCalledWith('u1', 'p1');
      expect(result).toEqual({ saved: true, count: 3 });
    });

    it('delegates to posts.unsavePost', async () => {
      service.unsavePost.mockResolvedValue({ saved: false, count: 2 });

      const result = await controller.unsavePost(authReq(), 'p1');
      expect(service.unsavePost).toHaveBeenCalledWith('u1', 'p1');
      expect(result).toEqual({ saved: false, count: 2 });
    });
  });

  describe('deletePost', () => {
    it('delegates to posts.deletePost and returns success', async () => {
      service.deletePost.mockResolvedValue(undefined);

      const result = await controller.deletePost(
        { user: { sub: 'u1' } } as any,
        'p1',
      );
      expect(service.deletePost).toHaveBeenCalledWith('u1', 'p1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getPost', () => {
    it('delegates to posts.getPostById with optional userId', async () => {
      const post = { id: 'p1', caption: 'hi' };
      service.getPostById.mockResolvedValue(post);

      const result = await controller.getPost(optionalReq('u1'), 'p1');
      expect(service.getPostById).toHaveBeenCalledWith('p1', 'u1');
      expect(result).toBe(post);
    });
  });
});
