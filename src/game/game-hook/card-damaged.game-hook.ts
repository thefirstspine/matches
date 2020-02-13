import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard } from '../..//@shared/arena-shared/game';
import { MessagingService } from '../../@shared/messaging-shared/messaging.service';
import { GameHookService } from './game-hook.service';
import { ICard } from '../../@shared/rest-shared/card';
import { RestService } from '../../rest/rest.service';
import { randBetween } from '../../utils/maths.utils';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CardDamagedGameHook implements IGameHook {

  constructor(
    private readonly messagingService: MessagingService,
    private readonly gameHookService: GameHookService,
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard, lifeChanged: number}): Promise<boolean> {
    await this.messagingService.sendMessage(
      gameInstance.users.map((u: IGameUser) => u.user),
      `TheFirstSpine:game:${gameInstance.id}:cardChanged`,
      {
        changes: {
          life: params.lifeChanged,
        },
        gameCard: params.gameCard,
      });

    if (params.gameCard && params.gameCard.currentStats.life <= 0) {
      // Destroye the card
      await this.gameHookService.dispatch(gameInstance, `card:destroyed:${params.gameCard.card.id}`, {gameCard: params.gameCard});
    }
    return true;
  }

}
