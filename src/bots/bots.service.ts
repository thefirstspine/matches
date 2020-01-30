import { Injectable } from '@nestjs/common';
import env from '../@shared/env-shared/env';
import fetch, { Response } from 'node-fetch';

/**
 * Bots service to ask for a bot on a game type
 */
@Injectable()
export class BotsService {

  public async askForABot(gameType: string): Promise<IApiResponse> {
    // Call the bots service
    const ret: Response = await fetch(
      `${env.config.BOTS_URL}/api/spawn`,
      {
        method: 'post',
        body: JSON.stringify({
          type: 'arena',
          metadata: {
            gameType,
          },
        }),
        headers: {
          'Authorization': `Bearer ${env.config.BOTS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Process response
    const json = await ret.json();
    if (json.error) {
      throw new Error(json.error.message);
    }

    // Return response
    return json.result as IApiResponse;
  }

}

/**
 * Represents a bot API response
 */
export interface IApiResponse {
  result: boolean;
}
