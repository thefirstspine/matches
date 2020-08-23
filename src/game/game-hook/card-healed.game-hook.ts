import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard } from '@thefirstspine/types-arena';
import { MessagingService } from '@thefirstspine/messaging-nest';

/**
 * This subscriber is executed once a 'card:lifeChanged:healed' event is thrown. It will look for cards that
 * has too much life.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CardHealedGameHook implements IGameHook {

  constructor(
    private readonly messagingService: MessagingService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard|null, lifeChanged: number}): Promise<boolean> {
    await this.messagingService.sendMessage(
      gameInstance.users.map((u: IGameUser) => u.user),
      `TheFirstSpine:game:${gameInstance.id}:cardChanged`,
      {
        changes: {
          life: params.lifeChanged,
        },
        gameCard: params.gameCard,
      });

    if (this.shouldLimitMaxLife(params.gameCard, params.source) && params.gameCard.currentStats.life > params.gameCard.card.stats.life) {
      params.gameCard.currentStats.life = params.gameCard.card.stats.life;
    }

    return true;
  }

  protected shouldLimitMaxLife(target: IGameCard, source: IGameCard|null): boolean {
    if (target.card.id === 'anvil-of-xiarmha' && source === null) {
      // Anvil of Xiarm'ha can have more than the starting value in case of new turn
      return false;
    }
    if (target.card.id === 'anvil-of-xiarmha' && source?.card.id === 'reinforcement') {
      // Anvil of Xiarm'ha can have more than the starting value when reinforcement is used
      return false;
    }
    return true;
  }

}
