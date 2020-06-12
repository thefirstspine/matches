import { IGameWorker } from './../game-worker.interface';
import { IGameInstance,
  IGameAction,
  IInteractionMoveCardOnBoardPossibility,
  IInteractionSelectCoupleOnBoard,
  IGameCard,
  IGameActionPassed} from '@thefirstspine/types-arena';
import { Injectable } from '@nestjs/common';
import { GameWorkerService } from './../game-worker.service';
import { cardSide, ICardCoords, ICard } from '@thefirstspine/types-rest';
import { GameHookService } from '../../game-hook/game-hook.service';
import { IHasGameHookService, IHasGameWorkerService } from '../../injections.interface';
import { ArenaRoomsService } from '../../../rooms/arena-rooms.service';
import { RestService } from '../../../rest/rest.service';
import { LogsService } from '@thefirstspine/logs-nest';

/**
 * The main confrontation game worker. Normally a confrontation is closing the turn of the player. This worker
 * will self-generate confrontations once every confrontation is done, and then throw a game:turnEnded event.
 */
@Injectable() // Injectable required here for dependency injection
export class Fpe11GameWorker implements IGameWorker, IHasGameHookService, IHasGameWorkerService {

  public gameHookService: GameHookService;
  public gameWorkerService: GameWorkerService;

  readonly type: string = 'fpe-11';

  constructor(
    private readonly logsService: LogsService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly restService: RestService,
  ) {}

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction<IInteractionSelectCoupleOnBoard>> {
    return {
      createdAt: Date.now(),
      type: this.type,
      name: {
        en: ``,
        fr: `Confronter`,
      },
      description: {
        en: ``,
        fr: `Confronter deux cartes`,
      },
      user: data.user as number,
      priority: 1,
      interaction: {
        type: 'selectCoupleOnBoard',
        description: {
          en: ``,
          fr: `Résoudre une confrontation.`,
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
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionSelectCoupleOnBoard>): Promise<boolean> {
    // Validate response form
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
    const possibilities: IInteractionMoveCardOnBoardPossibility[] = gameAction.interaction.params.possibilities;
    const possibility: IInteractionMoveCardOnBoardPossibility|undefined = possibilities.find((p: IInteractionMoveCardOnBoardPossibility) => {
      return p.boardCoordsFrom === boardCoordsFrom && p.boardCoordsTo.includes(boardCoordsTo);
    });
    if (!possibility) {
      this.logsService.warning('Possibility not found', gameAction);
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
      lifeLostTo = cardFromRotated.currentStats.bottom.strength - cardToRotated.currentStats.top.defense;
      lifeLostFrom = cardToRotated.currentStats.top.strength - cardFromRotated.currentStats.bottom.defense;
    }
    if (direction === 'top') {
      lifeLostTo = cardFromRotated.currentStats.top.strength - cardToRotated.currentStats.bottom.defense;
      lifeLostFrom = cardToRotated.currentStats.bottom.strength - cardFromRotated.currentStats.top.defense;
    }
    if (direction === 'left') {
      lifeLostTo = cardFromRotated.currentStats.left.strength - cardToRotated.currentStats.right.defense;
      lifeLostFrom = cardToRotated.currentStats.right.strength - cardFromRotated.currentStats.left.defense;
    }
    if (direction === 'right') {
      lifeLostTo = cardFromRotated.currentStats.right.strength - cardToRotated.currentStats.left.defense;
      lifeLostFrom = cardToRotated.currentStats.left.strength - cardFromRotated.currentStats.right.defense;
    }

    // Apply damages
    if (lifeLostTo > 0) {
      cardTo.currentStats.life -= lifeLostTo;
      await this.gameHookService.dispatch(
        gameInstance,
        `card:lifeChanged:damaged:${cardTo.card.id}`, {gameCard: cardTo, source: cardFrom, lifeChanged: -lifeLostTo});
    }
    if (lifeLostFrom > 0) {
      cardFrom.currentStats.life -= lifeLostFrom;
      await this.gameHookService.dispatch(
        gameInstance,
        `card:lifeChanged:damaged:${cardFrom.card.id}`, {gameCard: cardFrom, source: cardTo, lifeChanged: -lifeLostFrom});
    }

    // Get the old confronts based on the last 50 actions (+ this one)
    const alreadyConfront: string[] = [boardCoordsFrom];
    let isInConfront = true;
    for (let i = 0; i < 50 && i < gameInstance.actions.previous.length; i ++) {
      const prevAction: IGameActionPassed<IInteractionSelectCoupleOnBoard|any> =
        gameInstance.actions.previous[gameInstance.actions.previous.length - (i + 1)];
      if (prevAction.type === this.type && isInConfront) {
        alreadyConfront.push(prevAction.interaction.boardCoordsFrom);
      } else {
        isInConfront = false;
      }
    }

    // End turn
    const endTurnAction: IGameAction<any> = await this.gameWorkerService.getWorker('fpe-15').create(gameInstance, {user: gameAction.user});
    gameInstance.actions.current.push(endTurnAction);

    // Send message to rooms
    this.arenaRoomsService.sendMessageForGame(
      gameInstance,
      {
        fr: `Joue une confrontation`,
        en: ``,
      },
      gameAction.user);

    // Add a barbers in front of the ennemy
    const barbersCard: ICard = await this.restService.card('barbers');
    const barbersGameCard: IGameCard = {
      id: 'fpe_15',
      card: barbersCard,
      user: 0,
      location: 'board',
      coords: { x: 3, y: 5 },
      currentStats: JSON.parse(JSON.stringify(barbersCard.stats)),
      metadata: {},
    };
    gameInstance.cards.push(barbersGameCard);

    return true;
  }

  /**
   * Get all the confronts possibilities for a giver user in a game instance
   * @param gameInstance
   * @param user
   */
  protected getPossibilities(gameInstance: IGameInstance, user: number): IInteractionMoveCardOnBoardPossibility[] {
    const ret: IInteractionMoveCardOnBoardPossibility[] = [];
    gameInstance.cards.forEach((card: IGameCard) => {
      // Cards that does not have stats can confront
      if (!card.currentStats) {
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
            if (cardRotated.currentStats[s].capacity === 'threat') {
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
                card.user !== user &&
                ['creature', 'artifact', 'player'].includes(card.card.type);
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
      copy.currentStats.bottom = JSON.parse(JSON.stringify(card.currentStats.top));
      copy.currentStats.top = JSON.parse(JSON.stringify(card.currentStats.bottom));
    }

    return copy;
  }

  /**
   * Default refresh method
   * @param gameInstance
   * @param gameAction
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionSelectCoupleOnBoard>): Promise<void> {
    return;
  }

  /**
   * Expires by chosing confronts randomly
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionSelectCoupleOnBoard>): Promise<boolean> {
    const possibilities: IInteractionMoveCardOnBoardPossibility[] = gameAction.interaction.params.possibilities;
    const possibility: IInteractionMoveCardOnBoardPossibility = possibilities[Math.floor(Math.random() * possibilities.length)];
    const boardCoordsTo: string = possibility.boardCoordsTo[Math.floor(Math.random() * possibility.boardCoordsTo.length)];
    gameAction.response = {
      boardCoordsFrom: possibility.boardCoordsFrom,
      boardCoordsTo,
    };
    return true;
  }

  /**
   * Default delete method
   * @param gameInstance
   * @param gameAction
   */
  public async delete(gameInstance: IGameInstance, gameAction: IGameAction<IInteractionSelectCoupleOnBoard>): Promise<void> {
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
