import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser } from '@thefirstspine/types-matches';
import { RestService } from '../../rest/rest.service';
import { ICard, ICardCoords } from '@thefirstspine/types-game';
import { randBetween } from '../../utils/maths.utils';
import { shuffle } from '../../utils/array.utils';
import { Modifiers } from '../modifiers';

@Injectable()
export class GameCreatedGameHook implements IGameHook {

  constructor(
    private readonly restService: RestService,
  ) {}

  async execute(gameInstance: IGameInstance, params: {gameInstance: IGameInstance}): Promise<boolean> {
    if (gameInstance.modifiers.includes(Modifiers.GOLDEN_GALLEONS)) {
      // Get the "golden-galleon" card
      const goldenGalleonCard: ICard = await this.restService.card('golden-galleon');
      // Add the cards "golden-galleon"
      gameInstance.gameUsers.forEach((u: IGameUser) => {
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

    if (gameInstance.modifiers.includes(Modifiers.GREAT_ANCIENTS_EGGS)) {
      // Get the "great-ancient-egg" card
      const greatAncientCard: ICard = await this.restService.card('great-ancient-egg');
      // Add the cards "great-ancient-egg"
      gameInstance.gameUsers.forEach((u: IGameUser) => {
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

    if (gameInstance.modifiers.includes(Modifiers.ANNIHILATION_MATTS)) {
      // Get the "annihilation-matt" card
      const annihilationMattCard: ICard = await this.restService.card('annihilation-matt');
      // Add the cards "annihilation-matt"
      const coords: ICardCoords[] = [
        {x: 5, y: 5},
        {x: 1, y: 5},
        {x: 5, y: 1},
        {x: 1, y: 1},
      ];
      coords.forEach((coord: ICardCoords) => {
        const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
        gameInstance.cards.push({
          card: annihilationMattCard,
          id: `${gameInstance.id}_${randomId}`,
          location: 'board',
          user: 0,
          metadata: {},
          currentStats: JSON.parse(JSON.stringify(annihilationMattCard.stats)),
          coords: coord,
        });
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }

    if (gameInstance.modifiers.includes(Modifiers.FROZEN_STATUES)) {
      // Get the "annihilation-matt" card
      const iceStatueCard: ICard = await this.restService.card('ice-statue');
      // Add the cards "annihilation-matt"
      const coords: ICardCoords[] = [
        {x: 5, y: 5},
        {x: 1, y: 5},
        {x: 5, y: 1},
        {x: 1, y: 1},
        {x: 2, y: 2},
        {x: 4, y: 2},
        {x: 2, y: 4},
        {x: 4, y: 4},
      ];
      coords.forEach((coord: ICardCoords) => {
        const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
        gameInstance.cards.push({
          card: iceStatueCard,
          id: `${gameInstance.id}_${randomId}`,
          location: 'board',
          user: 0,
          metadata: {},
          currentStats: JSON.parse(JSON.stringify(iceStatueCard.stats)),
          coords: coord,
        });
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }

    if (gameInstance.modifiers.includes(Modifiers.TRICK_OR_TREAT)) {
      // Get the "trick-or-treat" card
      const trickOrTreatCard: ICard = await this.restService.card('trick-or-treat');
      // Add the cards "trick-or-treat"
      gameInstance.gameUsers.forEach((u: IGameUser) => {
        for (let i = 0; i < 6; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          gameInstance.cards.push({
            card: trickOrTreatCard,
            id: `${gameInstance.id}_${randomId}`,
            location: 'deck',
            user: u.user,
            metadata: {},
            currentStats: undefined,
          });
        }
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }

    if (gameInstance.modifiers.includes(Modifiers.HARVESTING_SOULS)) {
      // Get the "great-ancient-egg" card
      const bloodStrength: ICard = await this.restService.card('blood-strength');
      // Add the cards "great-ancient-egg"
      gameInstance.gameUsers.forEach((u: IGameUser) => {
        for (let i = 0; i < 4; i ++) {
          const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
          gameInstance.cards.push({
            card: bloodStrength,
            id: `${gameInstance.id}_${randomId}`,
            location: 'deck',
            user: u.user,
            metadata: {},
          });
        }
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }

    if (gameInstance.modifiers.includes(Modifiers.MUTATIONS)) {
      const mutateFox: ICard = await this.restService.card('mutate-fox');
      const mutateBanshee: ICard = await this.restService.card('mutate-banshee');
      const mutateTower: ICard = await this.restService.card('mutate-tower');
      const mutateBarbedWires: ICard = await this.restService.card('mutate-barbed-wires');
      gameInstance.gameUsers.forEach((u: IGameUser) => {
        for (let i = 0; i < 2; i ++) {
          gameInstance.cards.push({
            card: mutateFox,
            id: `${gameInstance.id}_${randBetween(0, Number.MAX_SAFE_INTEGER)}`,
            location: 'deck',
            user: u.user,
            metadata: {},
          });
          gameInstance.cards.push({
            card: mutateBanshee,
            id: `${gameInstance.id}_${randBetween(0, Number.MAX_SAFE_INTEGER)}`,
            location: 'deck',
            user: u.user,
            metadata: {},
          });
          gameInstance.cards.push({
            card: mutateTower,
            id: `${gameInstance.id}_${randBetween(0, Number.MAX_SAFE_INTEGER)}`,
            location: 'deck',
            user: u.user,
            metadata: {},
          });
          gameInstance.cards.push({
            card: mutateBarbedWires,
            id: `${gameInstance.id}_${randBetween(0, Number.MAX_SAFE_INTEGER)}`,
            location: 'deck',
            user: u.user,
            metadata: {},
          });
        }
      });
      // Shuffle the cards
      gameInstance.cards = shuffle(gameInstance.cards);
    }

    return true;
  }

}
