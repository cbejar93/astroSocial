import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
const openai = new OpenAI();


@Injectable()
export class ModerationService {

    async checkContent() {

        const moderation = await openai.moderations.create({
            model: "omni-moderation-latest",
            input: [
                { type: "text", text: "...text to classify goes here..." },
                {
                    type: "image_url",
                    image_url: {
                        url: 'dsd'
                    }
                }
            ],
        });

    }

}


