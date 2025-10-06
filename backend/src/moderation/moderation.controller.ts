import { Body, Controller, Post } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CheckModerationDto } from './dto/check-moderation.dto';

@Controller('api/moderation')
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Post('check')
  checkContent(@Body() payload: CheckModerationDto) {
    return this.moderation.checkContent(payload);
  }
}
