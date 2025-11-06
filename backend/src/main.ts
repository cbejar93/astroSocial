import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolve } from 'path';
import * as express from 'express';
import * as path from 'path';
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

const logger = new Logger('Main');

async function bootstrap() {
  logger.log('📦 Bootstrap starting');

  const server = express();

  // Set up rate limiter: max 100 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());
  const isProduction = process.env.NODE_ENV === 'production';

  logger.log(`🔧 NODE_ENV = ${process.env.NODE_ENV || 'undefined'}`);
  logger.log(`🚀 Production mode? ${isProduction}`);

  // Static assets
  const clientDistPath = isProduction
    ? resolve(__dirname, '../public')
    : resolve(__dirname, '../../astrogram/dist');
  logger.log(`📂 Serving static files from: ${clientDistPath}`);
  server.use(express.static(clientDistPath));

  // Apply rate limiter before other middlewares that do file system access
  server.use(limiter);

  // Log every incoming HTTP request
  server.use((req: Request, _res: Response, next) => {
    logger.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
  });

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
    // if this is an API call, let Nest handle it (404, etc)
    if (req.path.startsWith('/api')) {
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
