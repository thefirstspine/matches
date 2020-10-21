import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '@thefirstspine/types-arena';
import { ICard } from '@thefirstspine/types-rest';
import { randBetween } from '../../utils/maths.utils';
import { RestService } from '../../rest/rest.service';

/**
 * This subscriber is executed once a 'card:destroyed:caduceus' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class IceStatueDestroyedGameHook implements IGameHook {

  constructor(private readonly restService: RestService) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard}): Promise<boolean> {
    const possibleCards: string[] = [
      'frozen-fox',
      'frozen-viper',
      'frozen-banshee',
    ];
    const iceStatueCard: ICard = await this.restService.card(possibleCards[randBetween(0, possibleCards.length - 1)]);
    const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
    gameInstance.cards.push({
      card: iceStatueCard,
      id: `${gameInstance.id}_${randomId}`,
      location: 'board',
      metadata: {},
      user: params.source.user,
      currentStats: JSON.parse(JSON.stringify(iceStatueCard.stats)),
      coords: JSON.parse(JSON.stringify(params.gameCard.coords)),
    });

    return true;
  }

}
