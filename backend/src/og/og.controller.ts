import { Controller, Get, Param, Req, Res, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Request, Response } from 'express';
import { resolve } from 'path';
import { OgService, PostOgData, LoungeOgData } from './og.service';

const PROD_URL = 'https://astrolounge.net';
const SITE_NAME = 'AstroLounge';
const DEFAULT_IMAGE = `${PROD_URL}/og-banner.svg`;
const DEFAULT_DESC = 'Share and discover cosmic photography and musings on AstroLounge.';

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectOgTags(
  html: string,
  opts: {
    title: string;
    description: string;
    image: string;
    url: string;
    type?: string;
  },
): string {
  const title = esc(`${opts.title} | ${SITE_NAME}`);
  const desc = esc(opts.description.slice(0, 160));
  const img = esc(opts.image);
  const url = esc(opts.url);
  const type = opts.type ?? 'website';

  const ogBlock = `  <meta property="og:site_name" content="${esc(SITE_NAME)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="${type}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${img}" />`;

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${desc}" />`)
    .replace(
      /<meta property="og:site_name"[\s\S]*?<meta name="twitter:image"[^>]*\/>/,
      ogBlock,
    );
}

@Controller()
export class OgController {
  private readonly logger = new Logger(OgController.name);
  private readonly clientDistPath: string;
  private cachedIndexHtml: string | null = null;

  constructor(private readonly ogService: OgService) {
    const isProduction = process.env.NODE_ENV === 'production';
    this.clientDistPath = isProduction
      ? resolve(__dirname, '../../public')
      : resolve(__dirname, '../../../astrogram/dist');
  }

  private getIndexHtml(): string {
    if (!this.cachedIndexHtml) {
      const indexPath = resolve(this.clientDistPath, 'index.html');
      try {
        this.cachedIndexHtml = readFileSync(indexPath, 'utf-8');
      } catch {
        this.cachedIndexHtml = null;
      }
    }
    return this.cachedIndexHtml ?? '';
  }

  @Get('post/:id')
  async servePost(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const post = await this.ogService.getPostData(id);
    if (!post) {
      return this.serveApp(res);
    }

    this.logger.log(`Serving OG tags for post ${id} (ua: ${req.headers['user-agent']?.slice(0, 60)})`);
    return res.send(this.buildPostHtml(post));
  }

  @Get('lounge/:name')
  async serveLounge(
    @Param('name') name: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const lounge = await this.ogService.getLoungeData(name);
    if (!lounge) {
      return this.serveApp(res);
    }

    this.logger.log(`Serving OG tags for lounge "${name}" (ua: ${req.headers['user-agent']?.slice(0, 60)})`);
    return res.send(this.buildLoungeHtml(lounge));
  }

  @Get('lounge/:name/post/:postId')
  async serveLoungePost(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const post = await this.ogService.getPostData(postId);
    if (!post) {
      return this.serveApp(res);
    }

    this.logger.log(`Serving OG tags for lounge post ${postId} (ua: ${req.headers['user-agent']?.slice(0, 60)})`);
    return res.send(this.buildPostHtml(post));
  }

  private buildPostHtml(post: PostOgData): string {
    return injectOgTags(this.getIndexHtml(), {
      title: post.title,
      description: post.description || `Posted by @${post.authorUsername}`,
      image: post.imageUrl ?? DEFAULT_IMAGE,
      url: post.url,
      type: 'article',
    });
  }

  private buildLoungeHtml(lounge: LoungeOgData): string {
    return injectOgTags(this.getIndexHtml(), {
      title: `${lounge.name} Lounge`,
      description: lounge.description || DEFAULT_DESC,
      image: lounge.imageUrl ?? DEFAULT_IMAGE,
      url: lounge.url,
    });
  }

  private serveApp(res: Response): void {
    const indexPath = resolve(this.clientDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        this.logger.error(`Failed to send index.html: ${(err as Error).message}`);
        res.status(500).send('Internal Server Error');
      }
    });
  }
}
