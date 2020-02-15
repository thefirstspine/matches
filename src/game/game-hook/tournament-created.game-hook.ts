import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser } from '../../@shared/arena-shared/game';
import { RestService } from '../../rest/rest.service';
import { ICycle } from '../../@shared/rest-shared/entities';
import { ICard } from '../../@shared/rest-shared/card';
import { randBetween } from '../../utils/maths.utils';
import { shuffle } from '../../utils/array.utils';

@Injectable()
export class TournamentCreatedGameHook implements IGameHook {

  constructor(
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameInstance: IGameInstance}): Promise<boolean> {
    const cycle: ICycle = await this.restService.currentCycle();
    if (cycle.id === 'great-old-2020') {
      // Get the "great-old-egg" card
      const greatOldCard: ICard = await this.restService.card('great-old-egg');
      // Add the cards "great-old-egg"
      gameInstance.users.forEach((u: IGameUser) => {
        for (let i = 0; i < 4; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          gameInstance.cards.push({
            card: greatOldCard,
            id: `${gameInstance.id}_${randomId}`,
            location: 'deck',
            user: u.user,
            metadata: {},
            currentStats: JSON.parse(JSON.stringify(greatOldCard.stats)),
          });
        }
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }
    return true;
  }

}
