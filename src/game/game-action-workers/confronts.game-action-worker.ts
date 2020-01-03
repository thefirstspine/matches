import { GameActionWorker } from './game-action-worker';
import { GameEvents } from '../game-subscribers/game-events';
import { IGameAction,
         IGameInstance,
         ISubActionMoveCardOnBoardPossibility,
         ISubActionSelectCoupleOnBoard,
         IGameCard } from '../../@shared/arena-shared/game';
import { cardSide } from '../../@shared/rest-shared/base';
import { ICardCoords } from '../../@shared/rest-shared/card';

/**
 * The main confrontation game worker. Normally a confrontation is closing the turn of the player. This worker
 * will self-generate confrontations once every confrontation is done, and then throw a game:turnEnded event.
 */
export class ConfrontsGameActionWorker extends GameActionWorker {

  static readonly TYPE: string = 'confronts';

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: ConfrontsGameActionWorker.TYPE,
      description: {
        en: ``,
        fr: `Confronter`,
      },
      user: data.user as number,
      priority: 1,
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
      return p.boardCoordsFrom === boardCoordsFrom;
    });
    if (!possibility.boardCoordsTo.includes(boardCoordsTo)) {
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
      await GameEvents.dispatch(
        gameInstance,
        `game:card:lifeChanged:damaged:${cardTo.card.id}`, {gameCard: cardTo, lifeChanged: -lifeLostTo});
    }
    if (lifeLostFrom > 0) {
      cardFrom.card.stats.life -= lifeLostFrom;
      await GameEvents.dispatch(
        gameInstance,
        `game:card:lifeChanged:damaged:${cardFrom.card.id}`, {gameCard: cardFrom, lifeChanged: -lifeLostFrom});
    }

    // Get the old confronts based on the last 50 actions (+ this one)
    const alreadyConfront: string[] = [boardCoordsFrom];
    let isInConfront = true;
    for (let i = 0; i < 50 && i < gameInstance.actions.previous.length; i ++) {
      const prevAction = gameInstance.actions.previous[gameInstance.actions.previous.length - (i + 1)];
      if (prevAction.type === ConfrontsGameActionWorker.TYPE && isInConfront) {
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
      const action: IGameAction = await GameActionWorker
        .getActionWorker(ConfrontsGameActionWorker.TYPE)
        .create(gameInstance, {user: gameAction.user});
      (action.subactions[0] as ISubActionSelectCoupleOnBoard).params.possibilities = newPossibilities;
      // Add the the pool
      gameInstance.actions.current.push(action);
    } else {
      // Change turn
      await GameEvents.dispatch(gameInstance, `game:turnEnded`, {user: gameAction.user});
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
      const attacksOn: cardSide[] = [];
      if (
        card.location === 'board' &&
        card.user === user &&
        card.card.type === 'creature'
      ) {
        attacksOn.push('top', 'right', 'bottom', 'left');
      }
      // TODO: the capacity "threat" works here

      if (attacksOn.length > 0) {
        attacksOn.forEach((side: cardSide) => {
          const coordsFrom: ICardCoords = JSON.parse(JSON.stringify(card.coords));
          const coordsTo: ICardCoords = JSON.parse(JSON.stringify(card.coords));
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

}
