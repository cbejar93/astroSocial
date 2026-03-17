import { Controller, Get, Param, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { resolve } from 'path';
import { OgService, PostOgData, LoungeOgData } from './og.service';

const PROD_URL = 'https://astrosocial.fly.dev';
const SITE_NAME = 'AstroLounge';
const DEFAULT_IMAGE = `${PROD_URL}/logo.png`;
const DEFAULT_DESC = 'Share and discover cosmic photography and musings on AstroLounge.';

const CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'linkedinbot',
  'whatsapp',
  'googlebot',
  'bingbot',
  'applebot',
  'iframely',
  'embedly',
  'pinterest',
  'vkshare',
  'w3c_validator',
];

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => ua.includes(p));
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}): string {
  const title = esc(`${opts.title} | ${SITE_NAME}`);
  const desc = esc(opts.description.slice(0, 160));
  const img = esc(opts.image);
  const url = esc(opts.url);
  const type = opts.type ?? 'website';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:site_name" content="${esc(SITE_NAME)}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="${type}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${img}" />
</head>
<body></body>
</html>`;
}

@Controller()
export class OgController {
  private readonly logger = new Logger(OgController.name);
  private readonly clientDistPath: string;

  constructor(private readonly ogService: OgService) {
    const isProduction = process.env.NODE_ENV === 'production';
    this.clientDistPath = isProduction
      ? resolve(__dirname, '../../public')
      : resolve(__dirname, '../../../astrogram/dist');
  }

  @Get('post/:id')
  async servePost(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!isCrawler(req.headers['user-agent'])) {
      return this.serveApp(res);
    }

    const post = await this.ogService.getPostData(id);
    if (!post) {
      return this.serveApp(res);
    }

    this.logger.log(`Serving OG tags for post ${id} to crawler`);
    return res.send(this.buildPostHtml(post));
  }

  @Get('lounge/:name')
  async serveLounge(
    @Param('name') name: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!isCrawler(req.headers['user-agent'])) {
      return this.serveApp(res);
    }

    const lounge = await this.ogService.getLoungeData(name);
    if (!lounge) {
      return this.serveApp(res);
    }

    this.logger.log(`Serving OG tags for lounge "${name}" to crawler`);
    return res.send(this.buildLoungeHtml(lounge));
  }

  @Get('lounge/:name/post/:postId')
  async serveLoungePost(
    @Param('postId') postId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!isCrawler(req.headers['user-agent'])) {
      return this.serveApp(res);
    }

    const post = await this.ogService.getPostData(postId);
    if (!post) {
      return this.serveApp(res);
    }

    this.logger.log(`Serving OG tags for lounge post ${postId} to crawler`);
    return res.send(this.buildPostHtml(post));
  }

  private buildPostHtml(post: PostOgData): string {
    return buildOgHtml({
      title: post.title,
      description: post.description || `Posted by @${post.authorUsername}`,
      image: post.imageUrl ?? DEFAULT_IMAGE,
      url: post.url,
      type: 'article',
    });
  }

  private buildLoungeHtml(lounge: LoungeOgData): string {
    return buildOgHtml({
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
