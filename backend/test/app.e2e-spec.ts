import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WeatherService } from '../src/weather/weather.service';

beforeAll(() => {
  process.env.SUPA_URL = 'http://localhost';
  process.env.SUPA_SERVICE_KEY = 'key';
  process.env.FACEBOOK_CLIENT_ID = 'id';
  process.env.FACEBOOK_CLIENT_SECRET = 'secret';
  process.env.GOOGLE_CLIENT_ID = 'id';
  process.env.GOOGLE_CLIENT_SECRET = 'secret';
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_REFRESH_SECRET = 'secret';
  process.env.JWT_EXPIRATION = '1h';
  process.env.JWT_REFRESH_EXPIRATION = '1h';
  process.env.BACKEND_URL = 'http://localhost';
});

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(WeatherService)
      .useValue({
        fetchVisibility: jest
          .fn()
          .mockResolvedValue([{ date: '2024-01-01', conditions: {} }]),
        fetchAstronomy: jest.fn().mockResolvedValue([
          {
            datetime: '2024-01-01',
            sunrise: '07:00',
            sunset: '19:00',
            moonrise: '09:00',
            moonset: '21:00',
            moonphase: 0.5,
          },
        ]),
        fetchLocationName: jest.fn().mockResolvedValue('Test City'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/weather (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/weather')
      .send({ latitude: 0, longitude: 0 })
      .expect(201);
    expect(res.body).toEqual({
      status: 'ok',
      coordinates: 'Test City',
      data: [
        {
          date: '2024-01-01',
          conditions: {},
          astro: {
            sunrise: '07:00',
            sunset: '19:00',
            moonrise: '09:00',
            moonset: '21:00',
            moonPhase: { phase: 'Full Moon', illumination: 50 },
          },
        },
      ],
    });
  });
});
