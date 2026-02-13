import { UnfurlController } from './unfurl.controller';
import { UnfurlService } from './unfurl.service';

describe('UnfurlController', () => {
  let controller: UnfurlController;
  let service: { unfurl: jest.Mock };

  beforeEach(() => {
    service = { unfurl: jest.fn() };
    controller = new UnfurlController(service as unknown as UnfurlService);
  });

  describe('unfurl', () => {
    it('delegates to unfurlService.unfurl with body.url', async () => {
      const response = {
        url: 'https://example.com',
        title: 'Example',
        description: 'Desc',
      };
      service.unfurl.mockResolvedValue(response);

      const result = await controller.unfurl({ url: 'https://example.com' } as any);
      expect(service.unfurl).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe(response);
    });
  });
});
