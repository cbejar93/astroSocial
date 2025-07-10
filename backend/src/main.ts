import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {  resolve } from 'path';
import * as express from 'express';
import * as path from 'path';
import { Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';


const logger = new Logger('Main');

async function bootstrap() {
  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const isProduction = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: 'http://localhost:5173', 
    credentials: true,
  });

  const clientDistPath = isProduction
    ? resolve(__dirname, '../public') // This is where Docker puts React build
    : resolve(__dirname, '../../astrogram/dist'); // Local dev path

    console.log(`[Nest] NODE_ENV = ${process.env.NODE_ENV}`);
    console.log(`[Nest] isProduction = ${isProduction}`);
    console.log(`[Nest] Serving static files from: ${clientDistPath}`);
  server.use(express.static(clientDistPath));

  await app.init();

  // Serve index.html on all unmatched routes
  server.get('/{*any}', (req: Request, res: Response) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    logger.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath, err => {
      if (err) {
        console.error('Failed to send index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  });

  

  await app.listen(process.env.PORT ?? 3000);
  logger.log('App started');
}
bootstrap();
