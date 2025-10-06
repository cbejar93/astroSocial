import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { CheckModerationDto } from './dto/check-moderation.dto';

type ModerationContentItem =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: { url: string } }
  | { type: 'input_image'; image_base64: string };

@Injectable()
export class ModerationService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async checkContent({ texts = [], imageUrls = [], imageBase64 = [] }: CheckModerationDto) {
    const normalizedTexts = texts.filter((text) => text?.trim().length);
    const normalizedUrls = imageUrls.filter((url) => url?.trim().length);
    const normalizedBase64 = imageBase64.filter((value) => value?.trim().length);

    if (!normalizedTexts.length && !normalizedUrls.length && !normalizedBase64.length) {
      throw new BadRequestException('At least one text or image must be provided for moderation.');
    }

    const content: ModerationContentItem[] = [
      ...normalizedTexts.map<ModerationContentItem>((text) => ({ type: 'input_text', text })),
      ...normalizedUrls.map<ModerationContentItem>((url) => ({ type: 'input_image', image_url: { url } })),
      ...normalizedBase64.map<ModerationContentItem>((value) => ({ type: 'input_image', image_base64: value })),
    ];

    const response = await this.client.responses.create({
      model: 'omni-moderation-latest',
      input: [
        {
          role: 'user',
          content,
        },
      ],
    });

    return {
      id: response.id,
      created: response.created,
      model: response.model,
      output: response.output,
      usage: response.usage,
    };
  }
}


