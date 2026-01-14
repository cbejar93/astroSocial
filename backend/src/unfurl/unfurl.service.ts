import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { UnfurlResponseDto } from './dto/unfurl.dto';

type CacheEntry = {
  expiresAt: number;
  value: UnfurlResponseDto;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 4000;
const MAX_RESPONSE_BYTES = 1024 * 1024;

@Injectable()
export class UnfurlService {
  private readonly logger = new Logger(UnfurlService.name);
  private readonly cache = new Map<string, CacheEntry>();

  async unfurl(url: string): Promise<UnfurlResponseDto> {
    const normalized = this.normalizeUrl(url);
    const cached = this.cache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    await this.ensureSafeUrl(normalized);
    const html = await this.fetchHtml(normalized);

    const response: UnfurlResponseDto = {
      url: normalized,
      title: this.getMetaContent(html, 'og:title') ?? this.getTitle(html),
      description:
        this.getMetaContent(html, 'og:description') ??
        this.getMetaByName(html, 'description'),
      imageUrl: this.getMetaContent(html, 'og:image'),
      siteName: this.getMetaContent(html, 'og:site_name'),
    };

    this.cache.set(normalized, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value: response,
    });

    return response;
  }

  private normalizeUrl(url: string) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new BadRequestException('Only HTTP/HTTPS URLs are allowed.');
      }
      return parsed.toString();
    } catch {
      throw new BadRequestException('Invalid URL.');
    }
  }

  private async ensureSafeUrl(url: string) {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      throw new BadRequestException('Invalid URL host.');
    }

    const addresses = await lookup(hostname, { all: true });
    for (const address of addresses) {
      if (this.isPrivateIp(address.address)) {
        throw new BadRequestException('Invalid URL host.');
      }
    }
  }

  private isPrivateIp(ip: string) {
    if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') {
      return true;
    }
    if (ip.startsWith('10.')) return true;
    if (ip.startsWith('192.168.')) return true;
    if (ip.startsWith('169.254.')) return true;
    if (ip.startsWith('100.')) {
      const second = Number(ip.split('.')[1]);
      if (second >= 64 && second <= 127) return true;
    }
    if (ip.startsWith('172.')) {
      const second = Number(ip.split('.')[1]);
      if (second >= 16 && second <= 31) return true;
    }
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
    if (ip.startsWith('fe80:')) return true;
    return false;
  }

  private async fetchHtml(url: string) {
    let currentUrl = url;
    for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(currentUrl, {
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent':
              'AstroSocialBot/1.0 (+https://example.com) unfurl',
            Accept: 'text/html,application/xhtml+xml',
          },
        });

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get('location');
          if (!location) {
            throw new BadRequestException('Invalid redirect.');
          }
          const nextUrl = new URL(location, currentUrl).toString();
          await this.ensureSafeUrl(nextUrl);
          currentUrl = nextUrl;
          continue;
        }

        if (!res.ok) {
          throw new BadRequestException('Unable to fetch URL.');
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          throw new BadRequestException('URL does not point to HTML content.');
        }

        return await this.readBodyWithLimit(res);
      } catch (err) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        this.logger.warn(`Failed to unfurl ${currentUrl}: ${String(err)}`);
        throw new BadRequestException('Unable to fetch URL.');
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new BadRequestException('Too many redirects.');
  }

  private async readBodyWithLimit(res: Response) {
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      if (text.length > MAX_RESPONSE_BYTES) {
        throw new BadRequestException('Response too large.');
      }
      return text;
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX_RESPONSE_BYTES) {
          throw new BadRequestException('Response too large.');
        }
        chunks.push(value);
      }
    }
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder('utf-8').decode(buffer);
  }

  private getMetaContent(html: string, property: string) {
    const regex = new RegExp(
      `<meta[^>]+property=[\"']${property}[\"'][^>]+content=[\"']([^\"']+)[\"'][^>]*>`,
      'i',
    );
    const match = html.match(regex);
    return match?.[1]?.trim();
  }

  private getMetaByName(html: string, name: string) {
    const regex = new RegExp(
      `<meta[^>]+name=[\"']${name}[\"'][^>]+content=[\"']([^\"']+)[\"'][^>]*>`,
      'i',
    );
    const match = html.match(regex);
    return match?.[1]?.trim();
  }

  private getTitle(html: string) {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match?.[1]?.trim();
  }
}
