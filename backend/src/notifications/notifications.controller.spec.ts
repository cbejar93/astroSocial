import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: { list: jest.Mock; countUnread: jest.Mock };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      countUnread: jest.fn(),
    };
    controller = new NotificationsController(
      service as unknown as NotificationsService,
    );
  });

  const authReq = (userId = 'u1') => ({ user: { sub: userId } }) as any;

  describe('list', () => {
    it('delegates to notifications.list with userId from req', async () => {
      service.list.mockResolvedValue([{ id: 'n1' }]);

      const result = await controller.list(authReq());
      expect(service.list).toHaveBeenCalledWith('u1');
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  describe('count', () => {
    it('delegates to notifications.countUnread and returns { count }', async () => {
      service.countUnread.mockResolvedValue(5);

      const result = await controller.count(authReq());
      expect(service.countUnread).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ count: 5 });
    });
  });
});
