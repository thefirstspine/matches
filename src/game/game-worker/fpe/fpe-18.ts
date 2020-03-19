import { IGameWorker } from '../game-worker.interface';
import { IGameInstance, IGameAction, IGameCard, ISubActionPutCardOnBoard } from '../../../@shared/arena-shared/game';
import { LogService } from '../../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../../injections.interface';
import { ArenaRoomsService } from '../../../rooms/arena-rooms.service';
import { GameWorkerService } from '../game-worker.service';

/**
 * The "place a card" action game worker. During his turn, the player can put one card on the board.
 */
@Injectable() // Injectable required here for dependency injection
export class Fpe18GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'fpe-18';

  constructor(
    private readonly logService: LogService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: this.type,
      description: {
        en: ``,
        fr: `Vous pouvez placer une carte sur le plateau de jeu.`,
      },
      user: data.user as number,
      priority: 1,
      subactions: [
        {
          type: 'putCardOnBoard',
          description: {
            en: ``,
            fr: `Placer une carte à côté d'une case déjà contrôlée`,
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

    // Add next the action
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-19').create(gameInstance, {user: gameAction.user});
    gameInstance.actions.current.push(action);

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
   * Get the possible hand indexes where a user can take a card from
   * @param gameInstance
   * @param user
   */
  protected getHandIndexes(gameInstance: IGameInstance, user: number): number[] {
    // Get the hand indexes of the creatures & artifacts
    return gameInstance.cards.filter((card: IGameCard) => {
      return card.user === user && card.location === 'hand';
    }).map((card: IGameCard, index: number) => {
      if (card.card.id === 'veneniagora') {
        return index;
      }
      return null;
    }).filter((i: number) => i !== null);
  }

  /**
   * Get the possible board coordinates where the user can place a card
   * @param gameInstance
   * @param user
   */
  protected getBoardCoords(gameInstance: IGameInstance, user: number): string[] {
    return ['3-5'];
  }
}
