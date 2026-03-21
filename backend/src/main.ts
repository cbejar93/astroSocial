import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolve } from 'path';
import * as express from 'express';
import * as path from 'path';
import { Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const logger = new Logger('Main');

async function bootstrap() {
  logger.log('📦 Bootstrap starting');

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
      frameguard: { action: 'sameorigin' },
      noSniff: true,
      hidePoweredBy: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            'https://www.youtube.com',
            'https://s.ytimg.com',
            'https://accounts.google.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            process.env.SUPA_URL ?? '',
            'https://i.ytimg.com',
            'https://img.youtube.com',
            'https:',
          ],
          mediaSrc: ["'self'", 'blob:'],
          frameSrc: [
            'https://www.youtube.com',
            'https://www.youtube-nocookie.com',
            'https://accounts.google.com',
          ],
          connectSrc: ["'self'", process.env.SUPA_URL ?? '', 'wss:'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
        },
      },
    }),
  );

  logger.log(`🔧 NODE_ENV = ${process.env.NODE_ENV || 'undefined'}`);
  logger.log(`🚀 Production mode? ${isProduction}`);

  // Static assets
  const clientDistPath = isProduction
    ? resolve(__dirname, '../public')
    : resolve(__dirname, '../../astrogram/dist');
  logger.log(`📂 Serving static files from: ${clientDistPath}`);
  server.use(express.static(clientDistPath));

  // Log every incoming HTTP request
  server.use((req: Request, _res: Response, next) => {
    logger.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
  });

  const apiRateLimitWindowMs = Number.parseInt(
    process.env.API_RATE_LIMIT_WINDOW_MS ?? '60000',
    10,
  );
  const apiRateLimitMax = Number.parseInt(
    process.env.API_RATE_LIMIT_MAX ?? '120',
    10,
  );
  const apiAuthRateLimitMax = Number.parseInt(
    process.env.API_AUTH_RATE_LIMIT_MAX ?? '30',
    10,
  );
  const apiFeedRateLimitMax = Number.parseInt(
    process.env.API_FEED_RATE_LIMIT_MAX ?? '300',
    10,
  );

  const apiLimiter = rateLimit({
    windowMs: apiRateLimitWindowMs,
    max: apiRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
    skip: (req) =>
      req.path.startsWith('/api/auth') || req.path.startsWith('/api/posts/feed'),
  });

  const apiAuthLimiter = rateLimit({
    windowMs: apiRateLimitWindowMs,
    max: apiAuthRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many auth requests, please try again later.',
  });

  const apiFeedLimiter = rateLimit({
    windowMs: apiRateLimitWindowMs,
    max: apiFeedRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many feed requests, please try again later.',
  });

  server.use('/api/auth', apiAuthLimiter);
  server.use('/api/posts/feed', apiFeedLimiter);
  server.use('/api', apiLimiter);

  const serveIndexLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  });

  // CORS
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : [];
  if (process.env.NODE_ENV !== 'production') {
    envOrigins.push('http://localhost:5173');
  }
  app.enableCors({
    origin: envOrigins.length ? envOrigins : true,
    credentials: true,
  });
  logger.log(
    `🌐 CORS enabled for ${
      envOrigins.length ? envOrigins.join(', ') : 'all origins'
    }`,
  );

  // Catch-all to serve index.html

  // everything *not* under /api should be served your React app
  server.use((req, res, next) => {
    // if this is an API call or sitemap, let Nest handle it
    if (req.path.startsWith('/api') || req.path === '/sitemap.xml') {
      return next();
    }
    // otherwise send back index.html – React Router will take over in the browser
    serveIndexLimiter(req, res, (rateLimitError?: unknown) => {
      if (rateLimitError) {
        return next(rateLimitError as Error);
      }

      const indexPath = path.join(clientDistPath, 'index.html');
      logger.log(`🗂️  GET ${req.originalUrl} → serving index.html`);
      res.sendFile(indexPath, (err) => {
        if (err) {
          logger.error(`❌ Failed to send index.html: ${err.message}`, err.stack);
          res.status(500).send('Internal Server Error');
        }
      });
    });
  });

  // Initialize Nest
  await app.init();
  logger.log('✅ Nest application initialized F');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 App started and listening on port ${port}`);
}

bootstrap().catch((err: unknown) => {
  logger.error('Bootstrap failed', err instanceof Error ? err.stack : err);
  process.exit(1);
});
