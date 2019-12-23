import { GameActionWorker } from './game-action-worker';
import { IGameInstance,
         IGameAction,
         ISubActionMoveCardOnBoard,
         ISubActionMoveCardOnBoardPossibility,
         IGameCard} from '../game.service';
import { ICardCoords } from '../../libraries/generic.library';
import { GameEvents } from '../game-subscribers/game-events';

/**
 * The creature movin' game worker. Only allowed during the "actions" phase. The player can move
 * only one creature to only one empty adjacent square.
 */
export class MoveCreatureGameActionWorker extends GameActionWorker {

  static readonly TYPE: string = 'move-creature';

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: MoveCreatureGameActionWorker.TYPE,
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
    await GameEvents.dispatch(gameInstance, `card:creature:moved:${card.card.id}`);

    return true;
  }

  /**
   * Get the possible moves for a giver user in an instance
   * @param gameInstance
   * @param user
   */
  protected getPossibilities(gameInstance: IGameInstance, user: number): ISubActionMoveCardOnBoardPossibility[] {
    const ret: ISubActionMoveCardOnBoardPossibility[] = [];
    gameInstance.cards.forEach((card: IGameCard) => {
      if (card.location === 'board' && card.user === user && card.card.type === 'creature') {
        // We found a user's creature on the board
        const possibility: ISubActionMoveCardOnBoardPossibility = {
          boardCoordsFrom: `${card.coords.x}-${card.coords.y}`,
          boardCoordsTo: [],
        };
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
          if (gameInstance.cards.find((c: IGameCard) => c.location === 'board' && c.coords.x === coords.x && c.coords.y === coords.y)) {
            return;
          }
          possibility.boardCoordsTo.push(`${coords.x}-${coords.y}`);
        });
        // Register possibility
        ret.push(possibility);
      }
    });
    return ret;
  }

}
