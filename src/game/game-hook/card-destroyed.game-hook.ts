import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard } from '../../@shared/arena-shared/game';
import { MessagingService } from '../../@shared/messaging-shared/messaging.service';
import { GameHookService } from './game-hook.service';
import { ICard } from '../../@shared/rest-shared/card';
import { RestService } from '../../rest/rest.service';
import { randBetween } from '../../utils/maths.utils';

/**
 * This subscriber is executed once a 'game:card:destroyed' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CardDestroyedGameHook implements IGameHook {

  constructor(
    private readonly messagingService: MessagingService,
    private readonly gameHookService: GameHookService,
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    if (params.gameCard.currentStats.capacities && params.gameCard.currentStats.capacities.includes('burdenEarth')) {
      // On a card with "burdenEarth" capacity, place a Burden Earth card
      const burdenEarth: ICard = await this.restService.card('burden-earth');
      const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
      const burdenEarthGameCard: IGameCard = {
        card: burdenEarth,
        id: `${gameInstance}_${randomId}`,
        location: 'board',
        user: params.gameCard.user,
        coords: {
          x: params.gameCard.coords.x,
          y: params.gameCard.coords.y,
        },
      };
      gameInstance.cards.push(burdenEarthGameCard);
    }

    // Discard the card
    params.gameCard.location = 'discard';
    await this.gameHookService.dispatch(gameInstance, `card:discarded:${params.gameCard.card.id}`, {gameCard: params.gameCard});

    return true;
  }

}
