// src/users/users.controller.ts
import {
  Controller,
  Get,
  Req,
  UseGuards,
  Logger,
  Put,
  Post,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  Body,
  Delete,
  Param,
  HttpException,
  UseFilters,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import type { Request } from 'express';
import { UserDto } from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateTemperatureDto } from './dto/update-temperature.dto';
import { MulterExceptionFilter } from '../common/filters/multer-exception.filter';
import { CreateUserSocialAccountDto } from './dto/create-user-social-account.dto';
import { UserSocialAccountDto } from './dto/user-social-account.dto';

@Controller('api/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @Req() req: Request & { user: { sub: string; email: string } },
  ): Promise<UserDto> {
    const userId = req.user.sub;
    const userEmail = req.user.email;

    this.logger.log(`Received GET /api/users/me from ${userId} <${userEmail}>`);

    try {
      const user = await this.usersService.findById(userId);
      this.logger.log(
        `Returning user: id=${user.id}, username=${user.username}, profileComplete=${user.profileComplete}`,
      );
      // Include followed lounge IDs so the client knows which lounges
      // the user is already tracking without having to fetch them
      // separately.
      return user;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in GET /api/users/me for ${userId}: ${message}`,
        stack,
      );
      throw error;
    }
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @UseFilters(new MulterExceptionFilter())
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else
          cb(
            new Error('Unsupported file type. Allowed: JPEG, PNG, GIF, TIFF.'),
            false,
          );
      },
      limits: { fileSize: 100 * 1024 * 1024 }, // optional 100MB limit
    }),
  )
  async updateProfile(
    @Req() req: Request & { user: { sub: string; email: string } },
    @Body('username') username: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UserDto> {
    const userId = req.user.sub;
    this.logger.log(`Received PUT /api/users/me from ${userId}`);

    try {
      // If a file was uploaded, pass it to service
      let avatarUrl: string | undefined;
      if (file) {
        avatarUrl = await this.usersService.uploadAvatar(userId, file);
        this.logger.log(`Uploaded avatar for ${userId}: ${avatarUrl}`);
      }

      console.log(username);
      console.log('=======');

      // You might also accept other body fields (e.g. username)
      // but for now we'll just update avatar + mark profileComplete
      return this.usersService.updateProfile(userId, username, avatarUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Error in PUT /api/users/me: ${message}`, stack);

      if (err instanceof HttpException) {
        throw err;
      }

      throw new InternalServerErrorException('Could not update profile');
    }
  }

  @Put('me/temperature')
  @UseGuards(JwtAuthGuard)
  async updateTemperature(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: UpdateTemperatureDto,
  ): Promise<UserDto> {
    return this.usersService.updateTemperaturePreference(
      req.user.sub,
      body.temperature,
    );
  }

  @Post('me/social-accounts')
  @UseGuards(JwtAuthGuard)
  async addSocialAccount(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: CreateUserSocialAccountDto,
  ): Promise<UserSocialAccountDto> {
    return this.usersService.addSocialAccount(req.user.sub, body);
  }

  @Get('me/social-accounts')
  @UseGuards(JwtAuthGuard)
  async getMySocialAccounts(
    @Req() req: Request & { user: { sub: string } },
  ): Promise<UserSocialAccountDto[]> {
    return this.usersService.listSocialAccountsForUser(req.user.sub);
  }

  @Get('me/posts')
  @UseGuards(JwtAuthGuard)
  getMyPosts(@Req() req: Request & { user: { sub: string } }) {
    return this.usersService.getPostsByUser(req.user.sub);
  }

  @Get('me/comments')
  @UseGuards(JwtAuthGuard)
  getMyComments(@Req() req: Request & { user: { sub: string } }) {
    return this.usersService.getCommentsByUser(req.user.sub);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteMe(@Req() req: Request & { user: { sub: string } }) {
    await this.usersService.deleteUser(req.user.sub);
    return { success: true };
  }

  @Get(':username/posts')
  getUserPosts(@Param('username') username: string) {
    return this.usersService.getPostsByUsername(username);
  }

  @Get(':username/comments')
  getUserComments(@Param('username') username: string) {
    return this.usersService.getCommentsByUsername(username);
  }

  @Get(':username/social-accounts')
  getUserSocialAccounts(@Param('username') username: string) {
    return this.usersService.listSocialAccountsByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':username/follow')
  async followUser(
    @Param('username') username: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    const user = await this.usersService.findByUsername(username);
    await this.usersService.followUser(user.id, req.user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':username/follow')
  async unfollowUser(
    @Param('username') username: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    const user = await this.usersService.findByUsername(username);
    await this.usersService.unfollowUser(user.id, req.user.sub);
    return { success: true };
  }

  @Get(':username/followers')
  async getFollowers(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getFollowers(user.id);
  }

  @Get(':username/following')
  async getFollowing(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    return this.usersService.getFollowing(user.id);
  }

  @Get(':username')
  getUser(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
