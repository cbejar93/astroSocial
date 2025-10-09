import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { ModerationMultiModalInput } from 'openai/resources/moderations';
import { CheckModerationDto } from './dto/check-moderation.dto';

type ModerationContentItem =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

@Injectable()
export class ModerationService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async checkContent({
    texts = [],
    imageUrls = [],
    imageBase64 = [],
  }: CheckModerationDto) {
    const normalizedTexts = texts.filter((text) => text?.trim().length);
    const normalizedUrls = imageUrls.filter((url) => url?.trim().length);
    const normalizedBase64 = imageBase64.filter(
      (value) => value?.trim().length,
    );

    if (
      !normalizedTexts.length &&
      !normalizedUrls.length &&
      !normalizedBase64.length
    ) {
      throw new BadRequestException(
        'At least one text or image must be provided for moderation.',
      );
    }

    const content: ModerationMultiModalInput[] = [
      ...normalizedTexts.map<ModerationContentItem>((text) => ({
        type: 'text',
        text,
      })),
      ...normalizedUrls.map<ModerationContentItem>((url) => ({
        type: 'image_url',
        image_url: { url },
      })),
      ...normalizedBase64.map<ModerationContentItem>((value) => ({
        type: 'image_url',
        image_url: {
          url: value.startsWith('data:')
            ? value
            : `data:image/jpeg;base64,${value}`,
        },
      })),
    ];

    const response = await this.client.moderations.create({
      model: 'omni-moderation-latest',
      input: content,
    });

    return {
      id: response.id,
      createdAt: Date.now(),
      model: response.model,
      results: response.results,
    };
  }
}
