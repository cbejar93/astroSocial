import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: { recordEvents: jest.Mock; getSummary: jest.Mock };

  beforeEach(() => {
    service = {
      recordEvents: jest.fn(),
      getSummary: jest.fn(),
    };
    controller = new AnalyticsController(service as unknown as AnalyticsService);
  });

  describe('ingestEvents', () => {
    it('delegates to analytics.recordEvents with body and extracted IP', async () => {
      service.recordEvents.mockResolvedValue({ count: 2 });
      const req = {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
        ip: '127.0.0.1',
      } as any;
      const body = { events: [{ type: 'page_view' }] } as any;

      const result = await controller.ingestEvents(body, req);
      expect(service.recordEvents).toHaveBeenCalledWith(body, '1.2.3.4');
      expect(result).toEqual({ count: 2 });
    });

    it('falls back to request.ip when no forwarded header', async () => {
      service.recordEvents.mockResolvedValue({ count: 1 });
      const req = { headers: {}, ip: '10.0.0.1' } as any;
      const body = { events: [{ type: 'click' }] } as any;

      await controller.ingestEvents(body, req);
      expect(service.recordEvents).toHaveBeenCalledWith(body, '10.0.0.1');
    });
  });

  describe('summary', () => {
    it('delegates to analytics.getSummary with parsed rangeDays', async () => {
      const summary = { rangeDays: 30, totals: { events: 100 } };
      service.getSummary.mockResolvedValue(summary);

      const result = await controller.summary('30');
      expect(service.getSummary).toHaveBeenCalledWith(30);
      expect(result).toBe(summary);
    });

    it('defaults to 7 when rangeDays is not a valid number', async () => {
      service.getSummary.mockResolvedValue({});

      await controller.summary('abc');
      expect(service.getSummary).toHaveBeenCalledWith(7);
    });
  });
});
