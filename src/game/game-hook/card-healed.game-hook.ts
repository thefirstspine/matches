import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard } from '../..//@shared/arena-shared/game';
import { MessagingService } from '../..//@shared/messaging-shared/messaging.service';
import { ICard } from '../..//@shared/rest-shared/card';
import { RestService } from '../..//rest/rest.service';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:healed' event is thrown. It will look for cards that
 * has too much life.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CardHealedGameHook implements IGameHook {

  constructor(
    private readonly messagingService: MessagingService,
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, lifeChanged: number}): Promise<boolean> {
    await this.messagingService.sendMessage(
      gameInstance.users.map((u: IGameUser) => u.user),
      `TheFirstSpine:game:${gameInstance.id}:cardChanged`,
      {
        changes: {
          life: params.lifeChanged,
        },
        gameCard: params.gameCard,
      });

    if (params.gameCard.currentStats.life > params.gameCard.card.stats.life) {
      params.gameCard.currentStats.life = params.gameCard.card.stats.life;
    }

    return true;
  }

}
