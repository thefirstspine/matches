import { IGameWorker } from './game-worker.interface';
import { IGameInstance, IGameAction, ISubActionPutCardOnBoard, IGameCard } from '../../@shared/arena-shared/game';
import { LogService } from '../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { ICard } from '../../@shared/rest-shared/card';
import { RestService } from '../../rest/rest.service';
import { randBetween } from '../../utils/maths.utils';

/**
 * Worker for "the-void" spell.
 */
@Injectable() // Injectable required here for dependency injection
export class SpellTheVoidGameWorker implements IGameWorker, IHasGameHookService {

  public gameHookService: GameHookService;

  readonly type: string = 'spell-the-void';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly restService: RestService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: this.type,
      name: {
        en: `Jouer Le Vide`,
        fr: ``,
      },
      description: {
        en: ``,
        fr: `Jouer Le Vide sur une carte`,
      },
      user: data.user as number,
      priority: 1,
      subactions: [
        {
          type: 'putCardOnBoard',
          description: {
            en: ``,
            fr: `Jouer un sort sur une carte`,
          },
          params: {
            handIndexes: this.getHandIndexes(gameInstance, data.user),
            boardCoords: this.getBoardCoords(gameInstance, data.user),
          },
        },
      ],
    };
  }

  /**
   * @inheritdoc
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    (gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes =
      this.getHandIndexes(gameInstance, gameAction.user);
    (gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords =
      this.getBoardCoords(gameInstance, gameAction.user);
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Validate response form
    if (
      !gameAction.responses[0] ||
      gameAction.responses[0].handIndex === undefined ||
      gameAction.responses[0].boardCoords === undefined
    ) {
      this.logService.warning('Response in a wrong format', gameAction);
      return false;
    }

    // Validate response inputs
    const allowedHandIndexes: number[] = (gameAction.subactions[0] as ISubActionPutCardOnBoard).params.handIndexes;
    const allowedCoordsOnBoard: string[] = (gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords;
    const responseHandIndex: number = gameAction.responses[0].handIndex;
    const responseBoardCoords: string = gameAction.responses[0].boardCoords;
    if (!allowedHandIndexes.includes(responseHandIndex)) {
      this.logService.warning('Not allowed hand index', gameAction);
      return false;
    }
    if (!allowedCoordsOnBoard.includes(responseBoardCoords)) {
      this.logService.warning('Not allowed board coords', gameAction);
      return false;
    }

    // Transform coords
    const x: number = parseInt(responseBoardCoords.split('-')[0], 10);
    const y: number = parseInt(responseBoardCoords.split('-')[1], 10);

    // Discard the spell
    const cardUsed: IGameCard|undefined = gameInstance.cards
      .filter((c: IGameCard) => c.location === 'hand' && c.user === gameAction.user)
      .find((c: IGameCard, index: number) => index === responseHandIndex);
    if (!cardUsed) {
      this.logService.warning('Card not found', gameAction);
      return false;
    }
    cardUsed.location = 'discard';

    // Damage the card
    const cardTarget: IGameCard|undefined = gameInstance.cards
      .find((c: IGameCard) => c.location === 'board' && c.coords && c.coords.x === x && c.coords.y === y);
    if (!cardTarget) {
      this.logService.warning('Target not found', gameAction);
      return false;
    }
    cardTarget.location = 'discard';

    // Dispatch event
    await this.gameHookService.dispatch(gameInstance, `card:spell:used:${cardUsed.card.id}`, {gameCard: cardUsed});
    await this.gameHookService.dispatch(gameInstance, `card:destroyed:${cardTarget.card.id}`, {gameCard: cardTarget});

    // Test for possibility to put a ditch card
    if (!gameInstance.cards.find((c: IGameCard) => {
      return c.location === 'board' &&
        c.coords.x === cardTarget.coords.x &&
        c.coords.y === cardTarget.coords.y &&
        (['creature', 'artifact'].includes(c.card.type) || ['burden-earth', 'ditch'].includes(c.card.id));
    })) {
      const ditch: ICard = await this.restService.card('ditch');
      const randomId: number = randBetween(0, Number.MAX_SAFE_INTEGER);
      const ditchGameCard: IGameCard = {
        card: ditch,
        id: `${gameInstance}_${randomId}`,
        location: 'board',
        user: 0,
        coords: {
          x: cardTarget.coords.x,
          y: cardTarget.coords.y,
        },
      };
      gameInstance.cards.push(ditchGameCard);
    }

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `A joué Le Vide`,
        en: ``,
      },
      gameAction.user);

    return true;
  }

  /**
   * Default expires method
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    return true;
  }

  /**
   * Default delete method
   * @param gameInstance
   * @param gameAction
   */
  public async delete(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    gameInstance.actions.current = gameInstance.actions.current.filter((gameActionRef: IGameAction) => {
      if (gameActionRef === gameAction) {
        gameInstance.actions.previous.push({
          ...gameAction,
          passedAt: Date.now(),
        });
        return false;
      }
      return true;
    });
  }

  /**
   * Get the hand indexes of the spell
   * @param gameInstance
   * @param user
   */
  protected getHandIndexes(gameInstance: IGameInstance, user: number): number[] {
    // Get the hand indexes of the creatures & artifacts
    return gameInstance.cards.filter((card: IGameCard) => {
      return card.user === user && card.location === 'hand';
    }).map((card: IGameCard, index: number) => {
      if (card.card.id === 'the-void') {
        return index;
      }
      return null;
    }).filter((i: number) => i !== null);
  }

  /**
   * Get the board coordinates where the spell can be played
   * @param gameInstance
   * @param user
   */
  protected getBoardCoords(gameInstance: IGameInstance, user: number): string[] {
    // Get the coordinates where the user can place a card
    return gameInstance.cards
      .filter((card: IGameCard) => card.location === 'board' && ['creature', 'artifact'].includes(card.card.type) && card.coords)
      .map((card: IGameCard) => `${card.coords.x}-${card.coords.y}`);
  }
}
