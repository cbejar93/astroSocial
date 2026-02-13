import { BadRequestException } from '@nestjs/common';
import { UnfurlService } from './unfurl.service';

// Mock dns/promises lookup
jest.mock('dns/promises', () => ({
  lookup: jest.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('UnfurlService', () => {
  let service: UnfurlService;

  beforeEach(() => {
    service = new UnfurlService();
    mockFetch.mockReset();
  });

  describe('unfurl', () => {
    const htmlWithOg = `
      <html>
        <head>
          <meta property="og:title" content="Test Title">
          <meta property="og:description" content="Test Description">
          <meta property="og:image" content="https://example.com/img.png">
          <meta property="og:site_name" content="Example">
        </head>
        <body></body>
      </html>
    `;

    const mockSuccessResponse = (html: string) => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html; charset=utf-8']]) as any,
        body: {
          getReader: () => {
            let done = false;
            return {
              read: async () => {
                if (done) return { done: true, value: undefined };
                done = true;
                return { done: false, value: new TextEncoder().encode(html) };
              },
            };
          },
        },
      });
    };

    it('extracts og:title, og:description, og:image, og:site_name from HTML', async () => {
      mockSuccessResponse(htmlWithOg);

      const result = await service.unfurl('https://example.com');
      expect(result.title).toBe('Test Title');
      expect(result.description).toBe('Test Description');
      expect(result.imageUrl).toBe('https://example.com/img.png');
      expect(result.siteName).toBe('Example');
    });

    it('falls back to <title> tag when og:title missing', async () => {
      mockSuccessResponse('<html><head><title>Fallback Title</title></head></html>');

      const result = await service.unfurl('https://example.com/page');
      expect(result.title).toBe('Fallback Title');
    });

    it('falls back to meta name="description" when og:description missing', async () => {
      mockSuccessResponse(
        '<html><head><meta name="description" content="Meta Desc"></head></html>',
      );

      const result = await service.unfurl('https://example.com/page2');
      expect(result.description).toBe('Meta Desc');
    });

    it('returns cached result on second call within TTL', async () => {
      mockSuccessResponse(htmlWithOg);

      await service.unfurl('https://example.com/cached');
      mockFetch.mockReset();

      const result = await service.unfurl('https://example.com/cached');
      expect(result.title).toBe('Test Title');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for non-HTTP URL protocol', async () => {
      await expect(
        service.unfurl('ftp://example.com/file'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for invalid URL', async () => {
      await expect(
        service.unfurl('not-a-url'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for localhost URLs', async () => {
      // The lookup mock returns public IP, but ensureSafeUrl checks hostname
      const { lookup } = require('dns/promises');
      lookup.mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);

      await expect(
        service.unfurl('https://localhost/secret'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException for private IP addresses', async () => {
      const { lookup } = require('dns/promises');
      lookup.mockResolvedValueOnce([{ address: '10.0.0.1', family: 4 }]);

      await expect(
        service.unfurl('https://internal.example.com'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when fetch returns non-HTML content-type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]) as any,
        body: null,
      });

      await expect(
        service.unfurl('https://api.example.com/data'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when response is not ok (4xx/5xx)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Map([['content-type', 'text/html']]) as any,
      });

      await expect(
        service.unfurl('https://example.com/missing'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
