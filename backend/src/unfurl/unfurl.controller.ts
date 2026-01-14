import { Body, Controller, Post } from '@nestjs/common';
import { UnfurlRequestDto, UnfurlResponseDto } from './dto/unfurl.dto';
import { UnfurlService } from './unfurl.service';

@Controller('api/unfurl')
export class UnfurlController {
  constructor(private readonly unfurlService: UnfurlService) {}

  @Post()
  async unfurl(@Body() body: UnfurlRequestDto): Promise<UnfurlResponseDto> {
    return this.unfurlService.unfurl(body.url);
  }
}
