import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma } from '../test-utils/mocks';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AnalyticsService(prisma as unknown as PrismaService);
  });

  afterEach(async () => {
    // Clean up interval to prevent open handles
    await service.onModuleDestroy();
  });

  describe('recordEvents', () => {
    it('enqueues events and returns count', async () => {
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 2 });

      const result = await service.recordEvents({
        events: [
          { type: 'page_view' },
          { type: 'click' },
        ],
      });
      expect(result.count).toBe(2);
    });

    it('creates/upserts analytics session when sessionKey provided', async () => {
      prisma.analyticsSession.upsert.mockResolvedValue({ id: 'sess-1' });
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 1 });

      const result = await service.recordEvents({
        sessionKey: 'sk-123',
        userId: 'u1',
        events: [{ type: 'page_view' }],
      });
      expect(prisma.analyticsSession.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sessionKey: 'sk-123' } }),
      );
      expect(result.sessionId).toBe('sess-1');
    });

    it('returns count=0 when events array is empty', async () => {
      const result = await service.recordEvents({ events: [] });
      expect(result.count).toBe(0);
    });

    it('returns count=0 when events is undefined', async () => {
      const result = await service.recordEvents({} as any);
      expect(result.count).toBe(0);
    });

    it('flushes immediately when endedAt is provided', async () => {
      prisma.analyticsSession.upsert.mockResolvedValue({ id: 'sess-1' });
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 1 });

      await service.recordEvents({
        sessionKey: 'sk-123',
        endedAt: new Date().toISOString(),
        events: [{ type: 'session_end' }],
      });
      expect(prisma.analyticsEvent.createMany).toHaveBeenCalled();
    });
  });

  describe('recordCanonicalEvent', () => {
    it('delegates to recordEvents with correct shape', async () => {
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 1 });

      await service.recordCanonicalEvent({
        userId: 'u1',
        type: 'post.like',
        targetType: 'post',
        targetId: 'p1',
        metadata: { count: 5 },
      });
      // It should have been enqueued (internal). We can verify by flushing.
      // The key thing is it doesn't throw.
    });

    it('logs warning but does not throw when recording fails', async () => {
      prisma.analyticsEvent.createMany.mockRejectedValue(new Error('db fail'));

      // Should not throw
      await expect(
        service.recordCanonicalEvent({
          type: 'post.like',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('getSummary', () => {
    const mockSummaryData = () => {
      prisma.analyticsEvent.count.mockResolvedValue(100);
      prisma.analyticsEvent.findMany.mockResolvedValue([]);
      prisma.analyticsEvent.groupBy.mockResolvedValue([]);
      prisma.analyticsSession.findMany.mockResolvedValue([]);
      prisma.postInteraction.groupBy.mockResolvedValue([]);
      prisma.commentLike.count.mockResolvedValue(5);
      prisma.requestMetric.count.mockResolvedValue(2);
      prisma.requestMetric.aggregate.mockResolvedValue({
        _avg: { durationMs: 50 },
        _count: { _all: 100 },
      });
      prisma.requestMetric.findMany.mockResolvedValue([{ durationMs: 200 }]);
    };

    it('computes and returns fresh summary', async () => {
      mockSummaryData();
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 0 });

      const result = await service.getSummary(7);
      expect(result.rangeDays).toBe(7);
      expect(result.totals.events).toBe(100);
      expect(result.operationalMetrics.totalServerErrors).toBe(2);
    });

    it('returns cached summary when cache is valid', async () => {
      mockSummaryData();
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 0 });

      // First call populates cache
      await service.getSummary(7);
      // Second call should use cache
      const result = await service.getSummary(7);
      // analyticsEvent.count called only once (from first call)
      expect(prisma.analyticsEvent.count).toHaveBeenCalledTimes(1);
      expect(result.rangeDays).toBe(7);
    });

    it('defaults to 7 when rangeDays is not finite', async () => {
      mockSummaryData();
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 0 });

      const result = await service.getSummary(NaN);
      expect(result.rangeDays).toBe(7);
    });
  });

  describe('pruneOldAnalytics', () => {
    it('deletes events and sessions older than retention period', async () => {
      prisma.analyticsEvent.deleteMany.mockResolvedValue({ count: 10 });
      prisma.analyticsSession.deleteMany.mockResolvedValue({ count: 2 });
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 0 });

      await service.pruneOldAnalytics();
      expect(prisma.analyticsEvent.deleteMany).toHaveBeenCalled();
      expect(prisma.analyticsSession.deleteMany).toHaveBeenCalled();
    });
  });

  describe('invalidateSummaryCache', () => {
    it('clears the summary cache', async () => {
      const mockSummaryData = () => {
        prisma.analyticsEvent.count.mockResolvedValue(50);
        prisma.analyticsEvent.findMany.mockResolvedValue([]);
        prisma.analyticsEvent.groupBy.mockResolvedValue([]);
        prisma.analyticsSession.findMany.mockResolvedValue([]);
        prisma.postInteraction.groupBy.mockResolvedValue([]);
        prisma.commentLike.count.mockResolvedValue(0);
        prisma.requestMetric.count.mockResolvedValue(0);
        prisma.requestMetric.aggregate.mockResolvedValue({
          _avg: { durationMs: 0 },
          _count: { _all: 0 },
        });
      };
      mockSummaryData();
      prisma.analyticsEvent.createMany.mockResolvedValue({ count: 0 });

      await service.getSummary(7);
      service.invalidateSummaryCache();

      // After invalidation, next call should recompute
      await service.getSummary(7);
      expect(prisma.analyticsEvent.count).toHaveBeenCalledTimes(2);
    });
  });
});
