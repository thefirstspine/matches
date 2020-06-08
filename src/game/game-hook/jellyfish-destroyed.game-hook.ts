import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '@thefirstspine/types-arena';
import { randBetween } from '../../utils/maths.utils';
import { RestService } from '../../rest/rest.service';
import { ICard } from '@thefirstspine/types-rest';

/**
 * This subscriber is executed once a 'card:destroyed:medusa' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class JellyfishDestroyedGameHook implements IGameHook {

  public constructor(private readonly restService: RestService) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    // Test for possibility to put a ditch card
    if (!gameInstance.cards.find((c: IGameCard) => {
      return c.location === 'board' &&
        c.coords.x === params.gameCard.coords.x &&
        c.coords.y === params.gameCard.coords.y &&
        (['creature', 'artifact'].includes(c.card.type) || ['burden-earth', 'ditch'].includes(c.card.id));
    })) {
      const ditch: ICard = await this.restService.card('water');
      const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
      const ditchGameCard: IGameCard = {
        card: ditch,
        id: `${gameInstance}_${randomId}`,
        location: 'board',
        user: 0,
        coords: {
          x: params.gameCard.coords.x,
          y: params.gameCard.coords.y,
        },
      };
      gameInstance.cards.push(ditchGameCard);
    }

    return true;
  }

}
