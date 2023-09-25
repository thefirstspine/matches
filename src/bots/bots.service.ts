import { Injectable } from '@nestjs/common';
import axios from 'axios';

/**
 * Bots service to ask for a bot on a game type
 */
@Injectable()
export class BotsService {

  public async askForABot(key: string): Promise<IApiResponse> {
    // Call the bots service
    const ret = await axios.post(
      `${process.env.BOTS_URL}/api/spawn`,
      {
        type: 'arena',
        metadata: {
          key,
          realm: process.env.REALM,
        },
      },
      {
        headers: {
          'X-Client-Cert': Buffer.from(process.env.BOTS_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
          'Content-Type': 'application/json',
        },
      },
    );

    // Process response
    const json = ret.data;
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
