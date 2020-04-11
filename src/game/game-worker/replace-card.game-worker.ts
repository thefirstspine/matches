import { IGameWorker } from './game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, ISubActionPutCardOnBoard } from '../../@shared/arena-shared/game';
import { LogService } from '../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { ICardCoords } from '../../@shared/rest-shared/card';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { randBetween } from '../../utils/maths.utils';

/**
 * The "replace a card" action game worker. When the spell "replacement" is called this high prioritary action is required.
 */
@Injectable() // Injectable required here for dependency injection
export class ReplaceCardGameWorker implements IGameWorker, IHasGameHookService {

  public gameHookService: GameHookService;

  public readonly type: string = 'replace-card';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number, coords: ICardCoords}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: this.type,
      name: {
        en: ``,
        fr: `Placer une carte`,
      },
      description: {
        en: ``,
        fr: `Vous pouvez placer une carte sur le plateau de jeu.`,
      },
      expiresAt: Date.now() + (30 * 1000), // expires in 30 seconds
      user: data.user as number,
      priority: 3,
      subactions: [
        {
          type: 'putCardOnBoard',
          description: {
            en: ``,
            fr: `Placer une carte à la place`,
          },
          params: {
            handIndexes: this.getHandIndexes(gameInstance, data.user),
            boardCoords: [`${data.coords.x}-${data.coords.y}`],
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

    // Place the card
    const card: IGameCard|undefined = gameInstance.cards
      .filter((c: IGameCard) => c.location === 'hand' && c.user === gameAction.user)
      .find((c: IGameCard, index: number) => index === responseHandIndex);
    if (!card) {
      this.logService.warning('Card not found', gameAction);
      return false;
    }
    card.location = 'board';
    card.coords = {x, y};

    // Dispatch event
    await this.gameHookService.dispatch(gameInstance, `card:placed:${card.card.id}`, {gameCard: card});

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `A placé une carte`,
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
    const handIndexes = this.getHandIndexes(gameInstance, gameAction.user);
    const handIndex = handIndexes[randBetween(0, handIndexes.length)];
    const boardCoords = (gameAction.subactions[0] as ISubActionPutCardOnBoard).params.boardCoords[0];
    gameAction.responses = [{handIndex, boardCoords}];
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
   * Get the possible hand indexes where a user can take a card from
   * @param gameInstance
   * @param user
   */
  protected getHandIndexes(gameInstance: IGameInstance, user: number): number[] {
    // Get the hand indexes of the creatures & artifacts
    return gameInstance.cards.filter((card: IGameCard) => {
      return card.user === user && card.location === 'hand';
    }).map((card: IGameCard, index: number) => {
      if (['creature', 'artifact'].includes(card.card.type)) {
        return index;
      }
      return null;
    }).filter((i: number) => i !== null);
  }
}
