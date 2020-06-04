import { IGameWorker } from './game-worker.interface';
import {
  IGameInstance,
  IGameAction,
  IGameCard,
  IInteractionMoveCardOnBoard,
  IInteractionMoveCardOnBoardPossibility } from '@thefirstspine/types-arena';
import { Injectable } from '@nestjs/common';
import { ICardCoords } from '@thefirstspine/types-rest';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../injections.interface';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { GameWorkerService } from './game-worker.service';
import { LogsService } from '@thefirstspine/logs-nest';

/**
 * At the beggining of his turn, the player can throw to the discard one or more cards.
 */
@Injectable() // Injectable required here for dependency injection
export class RunGameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  public readonly type: string = 'run';

  constructor(
    private readonly logsService: LogsService,
    private readonly arenaRoomsService: ArenaRoomsService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction<IInteractionMoveCardOnBoard>> {
    return {
      createdAt: Date.now(),
      type: this.type,
      name: {
        en: ``,
        fr: `Jouer la course`,
      },
      description: {
        en: ``,
        fr: `Déplacer une carte qui a la course sur le plateau de jeu.`,
      },
      user: data.user as number,
      priority: 2,
      interaction: {
        type: 'moveCardOnBoard',
        description: {
          en: ``,
          fr: `Déplacer une carte qui a la course d'une case.`,
        },
        params: {
          possibilities: this.getPossibilities(gameInstance, data.user),
        },
      },
    };
  }

  /**
   * @inheritdoc
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionMoveCardOnBoard>): Promise<void> {
    gameAction.interaction.params.possibilities = this.getPossibilities(gameInstance, gameAction.user);
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionMoveCardOnBoard>): Promise<boolean> {
    // Validate the response form
    if (
      gameAction.response.boardCoordsFrom === undefined ||
      gameAction.response.boardCoordsTo === undefined
    ) {
      this.logsService.warning('Response in a wrong format', gameAction);
      return false;
    }

    // Validate response input
    const boardCoordsFrom: string = gameAction.response.boardCoordsFrom;
    const boardCoordsTo: string = gameAction.response.boardCoordsTo;
    let allowed: boolean = false;
    gameAction.interaction.params.possibilities
      .forEach((possibility: IInteractionMoveCardOnBoardPossibility) => {
      if (possibility.boardCoordsFrom === boardCoordsFrom && possibility.boardCoordsTo.includes(boardCoordsTo)) {
        allowed = true;
      }
    });
    if (!allowed) {
      this.logsService.warning('Not in the allowed possibilities', gameAction);
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
      this.logsService.warning('Card not found', gameAction);
      return false;
    }
    card.coords = {
      x: boardCoordsToX,
      y: boardCoordsToY,
    };

    // Dispatch event
    await this.gameHookService.dispatch(gameInstance, `card:creature:moved:${card.card.id}`);

    // Deletes the action "skip-run"
    gameInstance.actions.current.forEach((currentGameAction: IGameAction<IInteractionMoveCardOnBoard>) => {
      if (currentGameAction.type === 'skip-run') {
        this.gameWorkerService.getWorker(currentGameAction.type).delete(gameInstance, currentGameAction);
      }
    });

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `A joué une course`,
        en: ``,
      },
      gameAction.user);

    return true;
  }

  /**
   * Get the possible moves for a giver user in an instance
   * @param gameInstance
   * @param user
   */
  protected getPossibilities(gameInstance: IGameInstance, user: number): IInteractionMoveCardOnBoardPossibility[] {
    const ret: IInteractionMoveCardOnBoardPossibility[] = [];
    gameInstance.cards.forEach((card: IGameCard) => {
      if (card.location === 'board' &&
        card.user === user &&
        card.currentStats &&
        card.currentStats.capacities &&
        card.currentStats.capacities.includes('run')
      ) {
        // We found a user's creature on the board
        const possibility: IInteractionMoveCardOnBoardPossibility = {
          boardCoordsFrom: `${card.coords.x}-${card.coords.y}`,
          boardCoordsTo: [],
        };
        // Skip on a water square
        const square: IGameCard|undefined = gameInstance.cards.find((c: IGameCard) => {
          return c.location === 'board' && c.coords.x === card.coords.x && c.coords.y === card.coords.y && c.card.type === 'square';
        });
        if (card.card.type === 'creature' && square && square.card.id === 'water') {
          return;
        }
        // Get the possible moves
        const x: number = card.coords.x;
        const y: number = card.coords.y;
        [
          {x: x + 1, y},
          {x: x - 1, y},
          {x, y: y + 1},
          {x, y: y - 1},
        ].forEach((coords: ICardCoords) => {
          // Skip invalid coords
          if (coords.x < 0 || coords.y < 0 || coords.x > 6 || coords.y > 6) {
            return;
          }
          // Skip already taken coords
          const card: IGameCard =
            gameInstance.cards.find((c: IGameCard) => c.location === 'board' && c.coords.x === coords.x && c.coords.y === coords.y);
          if (card) {
            if (card.card.type === 'creature' || card.card.type === 'artifact' || card.card.type === 'player') {
              return;
            }
            if (card.card.id === 'ditch' || card.card.id === 'burden-earth') {
              return;
            }
          }
          possibility.boardCoordsTo.push(`${coords.x}-${coords.y}`);
        });
        // Register possibility
        ret.push(possibility);
      }
    });
    return ret;
  }

  /**
   * Default expires method
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionMoveCardOnBoard>): Promise<boolean> {
    return true;
  }

  /**
   * Default delete method
   * @param gameInstance
   * @param gameAction
   */
  public async delete(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionMoveCardOnBoard>): Promise<void> {
    gameInstance.actions.current = gameInstance.actions.current.filter((gameActionRef: IGameAction<any>) => {
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
