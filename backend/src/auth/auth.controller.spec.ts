import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { SupabaseClient } from '@supabase/supabase-js';

const mockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn(),
  },
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let supabase: ReturnType<typeof mockSupabaseClient>;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.REFRESH_COOKIE_DOMAIN = 'cookies.example';
    process.env.NODE_ENV = 'development';

    supabase = mockSupabaseClient();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateOAuthLogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: 'SUPABASE_CLIENT',
          useValue: supabase as unknown as SupabaseClient,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('supabaseAuth', () => {
    it('returns access token and sets refresh cookie when Supabase email confirmed', async () => {
      const mockRes = { cookie: jest.fn() } as any;
      const supabaseUser = {
        id: 'user-123',
        email: 'user@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
        user_metadata: { full_name: 'Example User' },
      };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: supabaseUser },
        error: null,
      });
      (authService.validateOAuthLogin as jest.Mock).mockResolvedValue({
        accessToken: 'api-token',
        refreshToken: 'refresh-token',
      });

      const response = await controller.supabaseAuth(
        { accessToken: 'supabase-token' },
        mockRes,
      );

      expect(supabase.auth.getUser).toHaveBeenCalledWith('supabase-token');
      expect(authService.validateOAuthLogin).toHaveBeenCalledWith(
        'user-123',
        'user@example.com',
        'Example User',
        'supabase',
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'jid',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'none',
          domain: 'cookies.example',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
      expect(response).toEqual({ accessToken: 'api-token' });
    });

    it('throws ForbiddenException when Supabase email not confirmed', async () => {
      const mockRes = { cookie: jest.fn() } as any;
      const supabaseUser = {
        id: 'user-123',
        email: 'user@example.com',
        email_confirmed_at: null,
        user_metadata: { full_name: 'Example User' },
      };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: supabaseUser },
        error: null,
      });

      await expect(
        controller.supabaseAuth({ accessToken: 'supabase-token' }, mockRes),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(authService.validateOAuthLogin).not.toHaveBeenCalled();
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });
});
