import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { FacebookStrategy } from './facebook.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { JwtRefreshGuard } from './jwt-refresh-guard';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRATION') },
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_REFRESH_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_REFRESH_EXPIRATION') },
      }),
    }),
    UsersModule,
  ],
  providers: [
    AuthService,
    GoogleStrategy,
    FacebookStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
  ],
  controllers: [AuthController],
  exports: [JwtModule, PassportModule, JwtRefreshGuard],
})
export class AuthModule {}
