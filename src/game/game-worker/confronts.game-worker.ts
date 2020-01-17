import { IGameWorker } from './game-worker.interface';
import { IGameInstance,
  IGameAction,
  ISubActionMoveCardOnBoardPossibility,
  ISubActionSelectCoupleOnBoard,
  IGameCard } from '../../@shared/arena-shared/game';
import { LogService } from '../../@shared/log-shared/log.service';
import { Injectable } from '@nestjs/common';
import { cardSide } from '../../@shared/rest-shared/base';
import { GameWorkerService } from './game-worker.service';
import { ICardCoords } from '../../@shared/rest-shared/card';
import { GameHookService } from '../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../injections.interface';

/**
 * The main confrontation game worker. Normally a confrontation is closing the turn of the player. This worker
 * will self-generate confrontations once every confrontation is done, and then throw a game:turnEnded event.
 */
@Injectable() // Injectable required here for dependency injection
export class ConfrontsGameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  readonly type: string = 'confronts';

  constructor(
    private readonly logService: LogService,
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
        fr: `Confronter`,
      },
      user: data.user as number,
      priority: 1,
      expiresAt: Date.now() + (30 * 1000), // expires in 30 seconds
      subactions: [
        {
          type: 'selectCoupleOnBoard',
          description: {
            en: ``,
            fr: `Résoudre une confrontation.`,
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
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Validate response form
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
    const possibilities: ISubActionMoveCardOnBoardPossibility[] = (gameAction.subactions[0] as ISubActionSelectCoupleOnBoard).params.possibilities;
    const possibility: ISubActionMoveCardOnBoardPossibility|undefined = possibilities.find((p: ISubActionMoveCardOnBoardPossibility) => {
      return p.boardCoordsFrom === boardCoordsFrom && p.boardCoordsTo.includes(boardCoordsTo);
    });
    if (!possibility) {
      this.logService.warning('Possibility not found', gameAction);
      return false;
    }

    // Find the cards
    const boardCoordsFromX: number = parseInt(boardCoordsFrom.split('-')[0], 10);
    const boardCoordsFromY: number = parseInt(boardCoordsFrom.split('-')[1], 10);
    const boardCoordsToX: number = parseInt(boardCoordsTo.split('-')[0], 10);
    const boardCoordsToY: number = parseInt(boardCoordsTo.split('-')[1], 10);
    const cardFrom: IGameCard = gameInstance.cards.find((c: IGameCard) => {
      return c.location === 'board' && c.coords.x === boardCoordsFromX && c.coords.y === boardCoordsFromY;
    });
    const cardTo: IGameCard = gameInstance.cards.find((c: IGameCard) => {
      return c.location === 'board' && c.coords.x === boardCoordsToX && c.coords.y === boardCoordsToY;
    });

    // Ensure that manipulations will not fuck everything
    const cardFromRotated: IGameCard = this.rotate(cardFrom, gameInstance);
    const cardToRotated: IGameCard = this.rotate(cardTo, gameInstance);

    // Rotate the cards according to the user
    let direction: cardSide|undefined;
    if (boardCoordsFromY - 1 === boardCoordsToY) {
      direction = 'top';
    }
    if (boardCoordsFromY + 1 === boardCoordsToY) {
      direction = 'bottom';
    }
    if (boardCoordsFromX - 1 === boardCoordsToX) {
      direction = 'left';
    }
    if (boardCoordsFromX + 1 === boardCoordsToX) {
      direction = 'right';
    }

    // Damages calculation
    let lifeLostTo = 0;
    let lifeLostFrom = 0;
    if (direction === 'bottom') {
      lifeLostTo = cardFromRotated.card.stats.bottom.strenght - cardToRotated.card.stats.top.defense;
      lifeLostFrom = cardToRotated.card.stats.top.strenght - cardFromRotated.card.stats.bottom.defense;
    }
    if (direction === 'top') {
      lifeLostTo = cardFromRotated.card.stats.top.strenght - cardToRotated.card.stats.bottom.defense;
      lifeLostFrom = cardToRotated.card.stats.bottom.strenght - cardFromRotated.card.stats.top.defense;
    }
    if (direction === 'left') {
      lifeLostTo = cardFromRotated.card.stats.left.strenght - cardToRotated.card.stats.right.defense;
      lifeLostFrom = cardToRotated.card.stats.right.strenght - cardFromRotated.card.stats.left.defense;
    }
    if (direction === 'right') {
      lifeLostTo = cardFromRotated.card.stats.right.strenght - cardToRotated.card.stats.left.defense;
      lifeLostFrom = cardToRotated.card.stats.left.strenght - cardFromRotated.card.stats.right.defense;
    }

    // Apply damages
    if (lifeLostTo > 0) {
      cardTo.card.stats.life -= lifeLostTo;
      await this.gameHookService.dispatch(
        gameInstance,
        `game:card:lifeChanged:damaged:${cardTo.card.id}`, {gameCard: cardTo, lifeChanged: -lifeLostTo});
    }
    if (lifeLostFrom > 0) {
      cardFrom.card.stats.life -= lifeLostFrom;
      await this.gameHookService.dispatch(
        gameInstance,
        `game:card:lifeChanged:damaged:${cardFrom.card.id}`, {gameCard: cardFrom, lifeChanged: -lifeLostFrom});
    }

    // Get the old confronts based on the last 50 actions (+ this one)
    const alreadyConfront: string[] = [boardCoordsFrom];
    let isInConfront = true;
    for (let i = 0; i < 50 && i < gameInstance.actions.previous.length; i ++) {
      const prevAction = gameInstance.actions.previous[gameInstance.actions.previous.length - (i + 1)];
      if (prevAction.type === this.type && isInConfront) {
        alreadyConfront.push(prevAction.responses[0].boardCoordsFrom);
      } else {
        isInConfront = false;
      }
    }

    // Get the new possibilities
    const newPossibilities = this.getPossibilities(gameInstance, gameAction.user).filter((p: ISubActionMoveCardOnBoardPossibility) => {
      return !alreadyConfront.includes(p.boardCoordsFrom);
    });

    if (newPossibilities.length > 0) {
      // Generate the action & replaces the possibilities
      const action: IGameAction = await this.gameWorkerService.getWorker(this.type).create(gameInstance, {user: gameAction.user});
      (action.subactions[0] as ISubActionSelectCoupleOnBoard).params.possibilities = newPossibilities;
      // Add the the pool
      gameInstance.actions.current.push(action);
    } else {
      // Change turn
      await this.gameHookService.dispatch(gameInstance, `game:turnEnded`, {user: gameAction.user});
    }

    return true;
  }

  /**
   * Get all the confronts possibilities for a giver user in a game instance
   * @param gameInstance
   * @param user
   */
  protected getPossibilities(gameInstance: IGameInstance, user: number): ISubActionMoveCardOnBoardPossibility[] {
    const ret: ISubActionMoveCardOnBoardPossibility[] = [];
    gameInstance.cards.forEach((card: IGameCard) => {
      // Cards that does not have stats can confront
      if (!card.card.stats) {
        return;
      }

      const attacksOn: cardSide[] = [];
      const allSides: cardSide[] = ['top', 'right', 'bottom', 'left'];
      const cardRotated: IGameCard = this.rotate(card, gameInstance);

      if (
        cardRotated.location === 'board' &&
        cardRotated.user === user
      ) {
        if (cardRotated.card.type === 'creature') {
          // The creatures can attack on all sides
          attacksOn.push('top', 'right', 'bottom', 'left');
        } else {
          // The other cards can attack on the "threat" side
          allSides.forEach((s: cardSide) => {
            if (cardRotated.card.stats[s].capacity === 'threat') {
              attacksOn.push(s);
            }
          });
        }
      }

      if (attacksOn.length > 0) {
        attacksOn.forEach((side: cardSide) => {
          const coordsFrom: ICardCoords = JSON.parse(JSON.stringify(cardRotated.coords));
          const coordsTo: ICardCoords = JSON.parse(JSON.stringify(cardRotated.coords));
          switch (side) {
            case 'bottom':
              coordsTo.y ++;
              break;
            case 'left':
              coordsTo.x --;
              break;
            case 'right':
              coordsTo.x ++;
              break;
            case 'top':
              coordsTo.y --;
              break;
          }

          if (
            gameInstance.cards.find((card) => {
              return card.location === 'board' &&
                card.coords.x === coordsTo.x &&
                card.coords.y === coordsTo.y &&
                card.user !== user;
            })
          ) {
            ret.push({
              boardCoordsFrom: `${coordsFrom.x}-${coordsFrom.y}`,
              boardCoordsTo: [`${coordsTo.x}-${coordsTo.y}`],
            });
          }
        });
      }
    });
    return ret;
  }

  /**
   * Get the player index according his place in the instance
   * @param user
   * @param gameInstance
   */
  protected getPlayerIndex(user: number, gameInstance: IGameInstance): number {
    return gameInstance.users.findIndex((w) => w.user === user);
  }

  /**
   * Rotate a card, changing its stats
   * @param card
   * @param gameInstance
   */
  protected rotate(card: IGameCard, gameInstance: IGameInstance): IGameCard {
    // Get the current user index
    const currentIndex = this.getPlayerIndex(card.user, gameInstance);

    // Copy card to not fuck everything
    const copy: IGameCard = JSON.parse(JSON.stringify(card));

    // 180 degrees rotation
    if (currentIndex === 0) {
      copy.card.stats.bottom = JSON.parse(JSON.stringify(card.card.stats.top));
      copy.card.stats.top = JSON.parse(JSON.stringify(card.card.stats.bottom));
    }

    return copy;
  }

  /**
   * Default refresh method
   * @param gameInstance
   * @param gameAction
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    return;
  }

  /**
   * Expires by chosing confronts randomly
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    const possibilities: ISubActionMoveCardOnBoardPossibility[] = (gameAction.subactions[0] as ISubActionSelectCoupleOnBoard).params.possibilities;
    const possibility: ISubActionMoveCardOnBoardPossibility = possibilities[Math.floor(Math.random() * possibilities.length)];
    const boardCoordsTo: string = possibility.boardCoordsTo[Math.floor(Math.random() * possibility.boardCoordsTo.length)];
    gameAction.responses = [{
      boardCoordsFrom: possibility.boardCoordsFrom,
      boardCoordsTo,
    }];
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
