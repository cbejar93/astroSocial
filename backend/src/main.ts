import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolve } from 'path';
import * as express from 'express';
import * as path from 'path';
import { Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';


const logger = new Logger('Main');

async function bootstrap() {
  logger.log('📦 Bootstrap starting');



  const server = express();
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

    // Catch-all to serve index.html
  
  // everything *not* under /api should be served your React app
  server.use((req, res, next) => {
    // if this is an API call, let Nest handle it (404, etc)
    if (req.path.startsWith('/api')) {
      return next()
    }
    // otherwise send back index.html – React Router will take over in the browser
    const indexPath = path.join(clientDistPath, 'index.html')
    logger.log(`🗂️  GET ${req.originalUrl} → serving index.html`)
    res.sendFile(indexPath, err => {
      if (err) {
        logger.error(`❌ Failed to send index.html: ${err.message}`, err.stack)
        res.status(500).send('Internal Server Error')
      }
    })
  })



  // Initialize Nest
  await app.init();
  logger.log('✅ Nest application initialized T');


  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 App started and listening on port ${port}`);
}

bootstrap().catch(err => {
  logger.error('Bootstrap failed', err.stack);
  process.exit(1);
});
