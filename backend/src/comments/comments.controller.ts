import { Controller, Get, Post, Body, Param, Req, UseGuards, Logger, Delete } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/jwt-optional.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('api')
export class CommentsController {

  private readonly logger = new Logger(CommentsController.name);

  constructor(private readonly comments: CommentsService) {}

  @UseGuards(OptionalAuthGuard)
  @Get('posts/:postId/comments')
  getComments(@Req() req: any, @Param('postId') postId: string) {

    const userId = req.user?.sub as string | undefined;
    this.logger.log(`Fetching comments for post ${postId}`);
    return this.comments.getCommentsForPost(postId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  create(@Req() req: any, @Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    const userId = req.user.sub as string;

    this.logger.log(`User ${userId} creating comment on post ${postId}`);

    return this.comments.createComment(userId, postId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/like')
  toggleLike(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub as string;

    this.logger.log(`User ${userId} toggling like on comment ${id}`);
    return this.comments.toggleLike(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub as string;

    this.logger.log(`User ${userId} deleting comment ${id}`);
    return this.comments.deleteComment(userId, id);
  }
}
