// src/users/users.controller.ts
import { Controller, Get, Req, UseGuards, Logger, Put, UseInterceptors, UploadedFile, InternalServerErrorException, Body, Delete, Param } from '@nestjs/common';
import { JwtAuthGuard }                             from '../auth/jwt-auth.guard';
import { UsersService }                             from './users.service';
import type { Request }                             from 'express';
import { UserDto }                                  from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @Req() req: Request & { user: { sub: string; email: string } }
  ): Promise<UserDto> {
    const userId = req.user.sub;
    const userEmail = req.user.email;

    this.logger.log(`Received GET /api/users/me from ${userId} <${userEmail}>`);

    try {
      const user = await this.usersService.findById(userId);
      this.logger.log(
        `Returning user: id=${user.id}, username=${user.username}, profileComplete=${user.profileComplete}, role=${user.role}`
      );

      return user;
    } catch (error: any) {
      this.logger.error(
        `Error in GET /api/users/me for ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid file type'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // optional 5MB limit
    }),
  )
  async updateProfile(
    @Req() req: Request & { user: { sub: string; email: string } },
    @Body("username") username: string,

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
    } catch (err: any) {
      this.logger.error(`Error in PUT /api/users/me: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Could not update profile');
    }
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

  @Get(':username')
  getUser(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }
}
