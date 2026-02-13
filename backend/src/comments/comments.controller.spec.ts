import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: {
    getCommentsForPost: jest.Mock;
    getCommentById: jest.Mock;
    createComment: jest.Mock;
    toggleLike: jest.Mock;
    deleteComment: jest.Mock;
  };

  beforeEach(() => {
    service = {
      getCommentsForPost: jest.fn(),
      getCommentById: jest.fn(),
      createComment: jest.fn(),
      toggleLike: jest.fn(),
      deleteComment: jest.fn(),
    };
    controller = new CommentsController(service as unknown as CommentsService);
  });

  const authReq = (userId = 'u1') => ({ user: { sub: userId } }) as any;
  const optionalReq = (userId?: string) =>
    ({ user: userId ? { sub: userId } : undefined }) as any;

  describe('getComments', () => {
    it('delegates to comments.getCommentsForPost with parsed params', async () => {
      const result = { comments: [], replies: [], total: 0 };
      service.getCommentsForPost.mockResolvedValue(result);

      const res = await controller.getComments(optionalReq('u1'), 'p1', '2', undefined, '10');
      expect(service.getCommentsForPost).toHaveBeenCalledWith(
        'p1',
        { page: 2, limit: 10, cursor: null },
        'u1',
      );
      expect(res).toBe(result);
    });
  });

  describe('getComment', () => {
    it('delegates to comments.getCommentById', async () => {
      const comment = { id: 'c1', text: 'hi' };
      service.getCommentById.mockResolvedValue(comment);

      const res = await controller.getComment(optionalReq(), 'c1');
      expect(service.getCommentById).toHaveBeenCalledWith('c1', undefined);
      expect(res).toBe(comment);
    });
  });

  describe('create', () => {
    it('delegates to comments.createComment with userId from req', async () => {
      const comment = { id: 'c1' };
      service.createComment.mockResolvedValue(comment);

      const res = await controller.create(authReq(), 'p1', { text: 'hello' });
      expect(service.createComment).toHaveBeenCalledWith('u1', 'p1', { text: 'hello' });
      expect(res).toBe(comment);
    });
  });

  describe('toggleLike', () => {
    it('delegates to comments.toggleLike', async () => {
      service.toggleLike.mockResolvedValue({ liked: true, count: 5 });

      const res = await controller.toggleLike(authReq(), 'c1');
      expect(service.toggleLike).toHaveBeenCalledWith('u1', 'c1');
      expect(res).toEqual({ liked: true, count: 5 });
    });
  });

  describe('delete', () => {
    it('delegates to comments.deleteComment', async () => {
      service.deleteComment.mockResolvedValue({ success: true });

      const res = await controller.delete(authReq(), 'c1');
      expect(service.deleteComment).toHaveBeenCalledWith('u1', 'c1');
      expect(res).toEqual({ success: true });
    });
  });
});
