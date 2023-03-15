import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard, IGameAction } from '@thefirstspine/types-arena';
import { GameHookService } from './game-hook.service';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { GameWorkerService } from '../game-worker/game-worker.service';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CardDamagedGameHook implements IGameHook {

  constructor(
    private readonly messagingService: MessagingService,
    private readonly gameHookService: GameHookService,
    private readonly gameWorkerService: GameWorkerService,
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

    // Death capacity
    if (
      params.gameCard.currentStats?.capacities?.includes('death') && // test on death capacity
      params.lifeChanged < 0 && // only positive damages trigger this capacity
      ['artifact', 'creature'].includes(params.source?.card?.type) && // only on creature & artifact source
      params.gameCard.location === 'board' // avoid to detroye a card twice
    ) {
      // Destroye the damaged card
      params.gameCard.location = 'discard';
      await this.gameHookService
        .dispatch(gameInstance, `card:destroyed:${params.gameCard.card.id}`, {gameCard: params.gameCard, source: params.source});
      // Destroye the source of damages
      params.source.location = 'discard';
      await this.gameHookService
        .dispatch(gameInstance, `card:destroyed:${params.source.card.id}`, {gameCard: params.source, source: params.gameCard});
    }

    if (params.gameCard?.currentStats?.effects?.includes('monstrous-portal')) {
      if (params.lifeChanged <= -1) {
        const action: IGameAction<any> = await this.gameWorkerService.getWorker('monstrous-portal-effect')
          .create(gameInstance, {user: params.gameCard.user});
        if (
          action.interaction.params.boardCoords.length > 0 &&
          action.interaction.params.handIndexes.length > 0
        ) {
          gameInstance.actions.current.push(action);
        }
      }
    }

    if (params.gameCard.location !== 'discard' && params.gameCard && params.gameCard.currentStats.life <= 0) {
      // Destroye the card
      await this.gameHookService
        .dispatch(gameInstance, `card:destroyed:${params.gameCard.card.id}`, {gameCard: params.gameCard, source: params.source});
    }
    return true;
  }

}
