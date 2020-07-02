import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser } from '@thefirstspine/types-arena';
import { RestService } from '../../rest/rest.service';
import { ICycle, ICard } from '@thefirstspine/types-rest';
import { randBetween } from '../../utils/maths.utils';
import { shuffle } from '../../utils/array.utils';

@Injectable()
export class TournamentCreatedGameHook implements IGameHook {

  constructor(
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameInstance: IGameInstance}): Promise<boolean> {
    const cycle: ICycle = await this.restService.currentCycle();

    if (cycle.id === 'great-ancient-2020') {
      // Get the "great-ancient-egg" card
      const greatAncientCard: ICard = await this.restService.card('great-ancient-egg');
      // Add the cards "great-ancient-egg"
      gameInstance.users.forEach((u: IGameUser) => {
        for (let i = 0; i < 4; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          gameInstance.cards.push({
            card: greatAncientCard,
            id: `${gameInstance.id}_${randomId}`,
            location: 'deck',
            user: u.user,
            metadata: {},
            currentStats: JSON.parse(JSON.stringify(greatAncientCard.stats)),
          });
        }
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }

    if (cycle.id === 'souvenirs-2020') {
      // Get the "great-ancient-egg" card
      const hunterSouvenirCard: ICard = await this.restService.card('hunter-souvenir');
      const conjurerSouvenirCard: ICard = await this.restService.card('conjurer-souvenir');
      const summonerSouvenirCard: ICard = await this.restService.card('summoner-souvenir');
      const sorcererSouvenirCard: ICard = await this.restService.card('sorcerer-souvenir');
      const souvenirs = {
        hunter: hunterSouvenirCard,
        conjurer: conjurerSouvenirCard,
        summoner: summonerSouvenirCard,
        sorcerer: sorcererSouvenirCard,
      };
      // Add the cards "great-ancient-egg"
      gameInstance.users.forEach((u: IGameUser) => {
        // Get the opponent
        const opponent = gameInstance.users.find((potentialOpponent: IGameUser) => potentialOpponent !== u);
        for (let i = 0; i < 4; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          gameInstance.cards.push({
            card: souvenirs[opponent.destiny],
            id: `${gameInstance.id}_${randomId}`,
            location: 'deck',
            user: u.user,
            metadata: {},
            currentStats: JSON.parse(JSON.stringify(souvenirs[opponent.destiny].stats)),
          });
        }
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }

    return true;
  }

}
