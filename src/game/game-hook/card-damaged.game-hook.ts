import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard } from '../..//@shared/arena-shared/game';
import { MessagingService } from '../..//@shared/messaging-shared/messaging.service';
import { GameHookService } from './game-hook.service';

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

    if (params.gameCard && params.gameCard.card.stats.life <= 0) {
      params.gameCard.location = 'discard';
      await this.gameHookService.dispatch(gameInstance, `card:discarded:${params.gameCard.card.id}`, {gameCard: params.gameCard});
    }
    return true;
  }

}
