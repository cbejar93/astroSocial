import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req: any) {
    const userId = req.user.sub as string;
    return this.notifications.list(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unread-count')
  async count(@Req() req: any) {
    const userId = req.user.sub as string;
    const count = await this.notifications.countUnread(userId);
    return { count };
  }
}
