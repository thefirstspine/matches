import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '@thefirstspine/types-arena';
import { QuestService } from '../../wizard/quest/quest.service';
import { TriumphService } from '../../wizard/triumph/triumph.service';

/**
 * This subscriber is executed once a 'card:placed' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CardPlacedGameHook implements IGameHook {

  constructor(
    private readonly questService: QuestService,
    private readonly triumphService: TriumphService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard}): Promise<boolean> {
    if (params.gameCard.card.type === 'creature') {
      await this.questService.progressQuest(
        params.gameCard.user,
        'play:creatures',
        1);
      await this.questService.progressQuest(
        params.gameCard.user,
        'play:creaturesOrArtifacts',
        1);
    }
    if (params.gameCard.card.type === 'artifact') {
      await this.questService.progressQuest(
        params.gameCard.user,
        'play:artifacts',
        1);
      await this.questService.progressQuest(
        params.gameCard.user,
        'play:creaturesOrArtifacts',
        1);
    }
    if (params.gameCard.currentStats?.effects?.includes('soul-of-a-sacrified-hunter')) {
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

      // Unlock title "sacrificer"
      if (str >= 10) {
        await this.triumphService.unlockTriumph(params.gameCard.user, 'transporter');
      }

      // Set card current stats
      params.gameCard.currentStats.life += life;
      params.gameCard.currentStats.bottom.strength += str;
      params.gameCard.currentStats.left.strength += str;
      params.gameCard.currentStats.right.strength += str;
      params.gameCard.currentStats.top.strength += str;

      // Act like this is the original stats to avoid bugs in healing
      params.gameCard.card.stats.life += life;
      params.gameCard.card.stats.bottom.strength += str;
      params.gameCard.card.stats.left.strength += str;
      params.gameCard.card.stats.right.strength += str;
      params.gameCard.card.stats.top.strength += str;
    }
    return true;
  }

}
