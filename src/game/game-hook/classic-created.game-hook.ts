import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser } from '../../@shared/arena-shared/game';
import { RestService } from '../../rest/rest.service';
import { ICycle, ICard } from '@thefirstspine/types-rest';
import { randBetween } from '../../utils/maths.utils';
import { shuffle } from '../../utils/array.utils';

@Injectable()
export class ClassicCreatedGameHook implements IGameHook {

  constructor(
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameInstance: IGameInstance}): Promise<boolean> {
    const cycle: ICycle = await this.restService.currentCycle();
    if (cycle.id === 'treasure-2020') {
      // Get the "golden-galleon" card
      const goldenGalleonCard: ICard = await this.restService.card('golden-galleon');
      // Add the cards "golden-galleon"
      gameInstance.users.forEach((u: IGameUser) => {
        for (let i = 0; i < 6; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          gameInstance.cards.push({
            card: goldenGalleonCard,
            id: `${gameInstance.id}_${randomId}`,
            location: 'deck',
            user: u.user,
            metadata: {},
            currentStats: JSON.parse(JSON.stringify(goldenGalleonCard.stats)),
          });
        }
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }
    return true;
  }

}
