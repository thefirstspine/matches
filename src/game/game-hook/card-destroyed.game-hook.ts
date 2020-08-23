import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard } from '@thefirstspine/types-arena';
import { GameHookService } from './game-hook.service';
import { ICard } from '@thefirstspine/types-rest';
import { RestService } from '../../rest/rest.service';
import { randBetween } from '../../utils/maths.utils';
import { Modifiers } from '../modifiers';

/**
 * This subscriber is executed once a 'game:card:destroyed' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class CardDestroyedGameHook implements IGameHook {

  constructor(
    private readonly gameHookService: GameHookService,
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard}): Promise<boolean> {
    let discard: boolean = true;

    if (params.gameCard?.currentStats?.capacities?.includes('burdenEarth')) {
      // On a card with "burdenEarth" capacity, place a Burden Earth card
      const burdenEarth: ICard = await this.restService.card('burden-earth');
      const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
      const burdenEarthGameCard: IGameCard = {
        card: burdenEarth,
        id: `${gameInstance}_${randomId}`,
        location: 'board',
        user: params.gameCard.user,
        coords: {
          x: params.gameCard.coords.x,
          y: params.gameCard.coords.y,
        },
      };
      gameInstance.cards.push(burdenEarthGameCard);
    }

    if (params.gameCard?.currentStats?.capacities?.includes('treason') && params.gameCard.user !== params?.source?.user) {
      // On a card with "treason" capacity, replace the card at the same position only on an empty square
      const card: IGameCard|undefined = gameInstance.cards.find((c: IGameCard) => {
        return c !== params.gameCard &&
          c.location === 'board' &&
          c.coords?.x === params.gameCard.coords?.x &&
          c.coords?.y === params.gameCard.coords?.y &&
          (
            c.card.type === 'creature' || c.card.type === 'artifact' || c.card.type === 'player' ||
            c.card.id === 'ditch' || c.card.id === 'burden-earth'
          );
      });
      if (!card) {
        // Do not discard the card at the end of the hook execution
        discard = false;
        // The square is free, replace it
        params.gameCard.location = 'board';
        params.gameCard.user = params.source.user;
        params.gameCard.currentStats = JSON.parse(JSON.stringify(params.gameCard.card.stats));
        if (params.gameCard.currentStats.capacities) {
          params.gameCard.currentStats.capacities = params.gameCard.currentStats.capacities.filter(c => c !== 'treason');
        }
      }
    }

    if (params.gameCard?.card?.type === 'creature') {
      if (gameInstance.modifiers.includes(Modifiers.HARVESTING_SOULS)) {
        // Get the player card
        const playerCard: IGameCard = gameInstance.cards.find((c: IGameCard) => c.card.type === 'player' && c.user === params.source?.user);
        if (playerCard) {
          playerCard.currentStats.life += 1;
          await this.gameHookService.dispatch(
            gameInstance,
            `card:lifeChanged:healed:${playerCard.card.id}`,
            {gameCard: playerCard, source: null, lifeChanged: 1});
        }
      }
    }

    // Discard the card
    if (discard) {
      params.gameCard.location = 'discard';
      await this.gameHookService.dispatch(gameInstance, `card:discarded:${params.gameCard.card.id}`, {gameCard: params.gameCard});
    }

    return true;
  }

}
