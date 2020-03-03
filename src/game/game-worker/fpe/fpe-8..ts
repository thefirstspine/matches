import { IGameWorker } from '../game-worker.interface';
import {
  IGameInstance,
  IGameAction,
  IGameCard,
  ISubActionMoveCardOnBoard,
  ISubActionMoveCardOnBoardPossibility } from '../../../@shared/arena-shared/game';
import { LogService } from '../../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { GameHookService } from '../../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../../injections.interface';
import { ArenaRoomsService } from '../../../rooms/arena-rooms.service';
import { GameWorkerService } from '../game-worker.service';

/**
 * At the beggining of his turn, the player can throw to the discard one or more cards.
 */
@Injectable() // Injectable required here for dependency injection
export class Fpe8GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'fpe-8';

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
        fr: `Déplacer une créature sur le plateau de jeu.`,
      },
      user: data.user as number,
      priority: 1,
      subactions: [
        {
          type: 'moveCardOnBoard',
          description: {
            en: ``,
            fr: `Déplacer une créature d'une case.`,
          },
          params: {
            possibilities: this.getPossibilities(gameInstance, data.user),
          },
        },
      ],
    };
  }

  /**
   * @inheritdoc
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    (gameAction.subactions[0] as ISubActionMoveCardOnBoard).params.possibilities =
      this.getPossibilities(gameInstance, gameAction.user);
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Validate the response form
    if (
      !gameAction.responses[0] ||
      gameAction.responses[0].boardCoordsFrom === undefined ||
      gameAction.responses[0].boardCoordsTo === undefined
    ) {
      this.logService.warning('Response in a wrong format', gameAction);
      return false;
    }

    // Validate response input
    const boardCoordsFrom: string = gameAction.responses[0].boardCoordsFrom;
    const boardCoordsTo: string = gameAction.responses[0].boardCoordsTo;
    let allowed: boolean = false;
    (gameAction.subactions[0] as ISubActionMoveCardOnBoard).params.possibilities
      .forEach((possibility: ISubActionMoveCardOnBoardPossibility) => {
      if (possibility.boardCoordsFrom === boardCoordsFrom && possibility.boardCoordsTo.includes(boardCoordsTo)) {
        allowed = true;
      }
    });
    if (!allowed) {
      this.logService.warning('Not in the allowed possibilities', gameAction);
      return false;
    }

    // Transform coords
    const boardCoordsFromX: number = parseInt(boardCoordsFrom.split('-')[0], 10);
    const boardCoordsFromY: number = parseInt(boardCoordsFrom.split('-')[1], 10);
    const boardCoordsToX: number = parseInt(boardCoordsTo.split('-')[0], 10);
    const boardCoordsToY: number = parseInt(boardCoordsTo.split('-')[1], 10);

    // Place the card
    const card = gameInstance.cards.find(
      (c: IGameCard) => {
        return c.location === 'board' &&
          c.user === gameAction.user &&
          c.coords &&
          c.coords.x === boardCoordsFromX &&
          c.coords.y === boardCoordsFromY;
      });
    if (!card) {
      this.logService.warning('Card not found', gameAction);
      return false;
    }
    card.coords = {
      x: boardCoordsToX,
      y: boardCoordsToY,
    };

    // Dispatch event
    await this.gameHookService.dispatch(gameInstance, `card:creature:moved:${card.card.id}`);

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `A déplacé une créature`,
        en: ``,
      },
      gameAction.user);

    // Add the next action
    const action: IGameAction = await this.gameWorkerService.getWorker('fpe-9').create(gameInstance, {user: gameAction.user});
    gameInstance.actions.current.push(action);

    return true;
  }

  /**
   * Get the possible moves for a giver user in an instance
   * @param gameInstance
   * @param user
   */
  protected getPossibilities(gameInstance: IGameInstance, user: number): ISubActionMoveCardOnBoardPossibility[] {
    return [{
      boardCoordsFrom: '3-3',
      boardCoordsTo: ['3-4'],
    }];
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
}
