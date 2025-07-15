import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolve } from 'path';
import * as express from 'express';
import * as path from 'path';
import { Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';

const logger = new Logger('Main');

async function bootstrap() {
  logger.log('📦 Bootstrap starting');



  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const isProduction = process.env.NODE_ENV === 'production';

  logger.log(`🔧 NODE_ENV = ${process.env.NODE_ENV || 'undefined'}`);
  logger.log(`🚀 Production mode? ${isProduction}`);

  // Log every incoming HTTP request
  server.use((req: Request, _res: Response, next) => {
    logger.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
  });

  // CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  logger.log('🌐 CORS enabled for http://localhost:5173');

  // Static assets
  const clientDistPath = isProduction
    ? resolve(__dirname, '../public')
    : resolve(__dirname, '../../astrogram/dist');
  logger.log(`📂 Serving static files from: ${clientDistPath}`);
  server.use(express.static(clientDistPath));

  // Initialize Nest
  await app.init();
  logger.log('✅ Nest application initialized');

  // Catch-all to serve index.html
  '/{*any}'
  server.get(/.*/, (req: Request, res: Response) => {
    // Optional: skip API routes
    if (req.path.startsWith('/api')) {
       res.status(404).send('Not Found');
       return
    }
  
    const indexPath = path.join(clientDistPath, 'index.html');
    logger.log(`🗂️  GET ${req.originalUrl} → serving index.html`);
    res.sendFile(indexPath, err => {
      if (err) {
        logger.error(`❌ Failed to send index.html: ${err.message}`, err.stack);
        res.status(500).send('Internal Server Error');
      }
    });
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 App started and listening on port ${port}`);
}

bootstrap().catch(err => {
  logger.error('Bootstrap failed', err.stack);
  process.exit(1);
});
