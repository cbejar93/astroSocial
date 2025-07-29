import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/jwt-optional.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('api')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @UseGuards(OptionalAuthGuard)
  @Get('posts/:postId/comments')
  getComments(@Param('postId') postId: string) {
    return this.comments.getCommentsForPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/comments')
  create(@Req() req: any, @Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    const userId = req.user.sub as string;
    return this.comments.createComment(userId, postId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/like')
  toggleLike(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub as string;
    return this.comments.toggleLike(userId, id);
  }
}
