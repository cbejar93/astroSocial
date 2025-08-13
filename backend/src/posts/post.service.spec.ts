import { PostsService } from './post.service';
import { InteractionType } from '@prisma/client';

describe('PostsService.getWeightedFeed', () => {
  it('includes reposted posts with reposter info', async () => {
    const prisma: any = {
      post: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'p1',
            author: { id: 'a1', username: 'author', avatarUrl: null },
            _count: { comments: 0 },
            interactions: [],
            title: '',
            body: 'original',
            imageUrl: null,
            likes: 0,
            shares: 0,
            reposts: 0,
            createdAt: new Date('2024-01-01T00:00:00Z')
          }
        ])
      },
      postInteraction: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'r1',
            createdAt: new Date('2024-01-02T00:00:00Z'),
            user: { id: 'u2', username: 'reposter', avatarUrl: null },
            post: {
              id: 'p1',
              author: { id: 'a1', username: 'author', avatarUrl: null },
              _count: { comments: 0 },
              interactions: [],
              title: '',
              body: 'original',
              imageUrl: null,
              likes: 0,
              shares: 0,
              reposts: 0,
              createdAt: new Date('2024-01-01T00:00:00Z')
            }
          }
        ])
      }
    };

    const service = new PostsService(prisma, {} as any, {} as any);
    const res = await service.getWeightedFeed('viewer', 1, 20);

    expect(prisma.post.findMany).toHaveBeenCalled();
    expect(prisma.postInteraction.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { type: InteractionType.REPOST } }));
    expect(res.posts.length).toBe(2);
    const repostItem = res.posts.find(p => p.repostedBy);
    expect(repostItem?.repostedBy?.username).toBe('reposter');
    expect(res.total).toBe(2);
  });
});
