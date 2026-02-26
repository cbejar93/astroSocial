import { Controller, Get, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ArticlesService } from '../articles/articles.service';

const PROD_URL = 'https://astrosocial.fly.dev';

@Controller()
export class SitemapController {
  private readonly logger = new Logger(SitemapController.name);

  constructor(private readonly articlesService: ArticlesService) {}

  @Get('sitemap.xml')
  async getSitemap(@Res() res: Response) {
    const today = new Date().toISOString().split('T')[0];

    const staticUrls = [
      { loc: `${PROD_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
      { loc: `${PROD_URL}/articles`, changefreq: 'daily', priority: '0.8', lastmod: today },
      { loc: `${PROD_URL}/lounges`, changefreq: 'weekly', priority: '0.7', lastmod: today },
      { loc: `${PROD_URL}/games`, changefreq: 'weekly', priority: '0.6', lastmod: today },
    ];

    let articleUrls: { loc: string; changefreq: string; priority: string; lastmod: string }[] = [];
    try {
      const { articles } = await this.articlesService.findAllPublished(1, 1000);
      articleUrls = articles.map((a: any) => ({
        loc: `${PROD_URL}/articles/${a.slug}`,
        lastmod: ((a.updatedAt ?? a.publishedAt ?? today) as string).split('T')[0],
        changefreq: 'monthly',
        priority: '0.9',
      }));
    } catch (err: unknown) {
      this.logger.error('Failed to fetch articles for sitemap', (err as Error).stack);
    }

    const allUrls = [...staticUrls, ...articleUrls];
    const urlEntries = allUrls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  }
}
