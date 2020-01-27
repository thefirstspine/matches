import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser, IGameCard } from '../../@shared/arena-shared/game';
import { MessagingService } from '../../@shared/messaging-shared/messaging.service';
import { GameHookService } from './game-hook.service';
import { ICard } from '../../@shared/rest-shared/card';
import { RestService } from '../../rest/rest.service';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class SoulOfASacrifiedHunterPlacesGameHook implements IGameHook {

  constructor(
    private readonly messagingService: MessagingService,
    private readonly gameHookService: GameHookService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    let life: number = 0;
    let str: number = 0;

    // Get cards in the user's discard
    gameInstance.cards.forEach((c: IGameCard) => {
      if (c.user === params.gameCard.user && c.location === 'discard') {
        if (c.card.type === 'artifact') {
          str ++;
        }
        if (c.card.type === 'creature') {
          life ++;
        }
      }
    });

    // Set card current stats
    params.gameCard.currentStats.life += life;
    params.gameCard.currentStats.bottom.strenght += str;
    params.gameCard.currentStats.left.strenght += str;
    params.gameCard.currentStats.right.strenght += str;
    params.gameCard.currentStats.top.strenght += str;

    // Act like this is the original stats to avoid bugs in healing
    params.gameCard.card.stats.life += life;
    params.gameCard.card.stats.bottom.strenght += str;
    params.gameCard.card.stats.left.strenght += str;
    params.gameCard.card.stats.right.strenght += str;
    params.gameCard.card.stats.top.strenght += str;

    return true;
  }

}
