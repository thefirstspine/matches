import { GameActionWorker } from './game-action-worker';
import { IGameInstance, IGameAction, IGameCard, ISubActionMoveCardToDiscard } from '../../@shared/arena-shared/game';
import { isArray } from 'util';
import { GameEvents } from '../game-subscribers/game-events';

/**
 * At the beggining of his turn, the player can throw to the discard one or more cards.
 */
export class ThrowCardsGameActionWorker extends GameActionWorker {

  static readonly TYPE: string = 'throw-cards';

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: ThrowCardsGameActionWorker.TYPE,
      description: {
        en: ``,
        fr: `Vous pouvez défausser une ou plusieurs cartes.`,
      },
      user: data.user as number,
      priority: 1,
      subactions: [
        {
          type: 'moveCardsToDiscard',
          description: {
            en: ``,
            fr: `Défausser une ou plusieurs cartes`,
          },
          params: {
            handIndexes: this.getHandIndexes(gameInstance, data.user),
            max: 6,
            min: 0,
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
    if (!isArray(gameAction.responses[0])) {
      this.logService.warning('Response in a wrong format', gameAction);
      return false;
    }

    // Validate response inputs
    const allowedHandIndexes: number[] = (gameAction.subactions[0] as ISubActionMoveCardToDiscard).params.handIndexes;
    const responseHandIndexes: number[] = gameAction.responses[0];
    const falseIndex: number[] = responseHandIndexes.filter((i: number) => !allowedHandIndexes.includes(i));
    if (falseIndex.length) {
      this.logService.warning('Not allowed hand index', gameAction);
      return false;
    }

    // Discard the cards
    const cards: IGameCard[] = [];
    gameInstance.cards.filter((c: IGameCard) => c.location === 'hand' && c.user === gameAction.user)
                      .forEach((c: IGameCard, index: number) => {
                        if (responseHandIndexes.includes(index)) {
                          cards.push(c);
                        }
                      });

    await Promise.all(cards.map((c: IGameCard) => {
      c.location = 'discard';
      return GameEvents.dispatch(gameInstance, `card:discarded:${c.card.id}`, {gameCard: c});
    }));

    // Pick the new cards
    const currentPlayerCard: IGameCard = gameInstance.cards.find(c => c.card && c.card.type === 'player' && c.user === gameAction.user);
    const currentCards: number = gameInstance.cards.filter(c => c.location === 'hand' && c.user === gameAction.user).length;
    for (let i = currentCards; i < 6; i ++) {
      const card = gameInstance.cards.find(c => c.location === 'deck' && c.user === gameAction.user);
      if (card) {
        card.location = 'hand';
        await GameEvents.dispatch(gameInstance, `game:card:picked:${card.card.id}`);
      } else {
        currentPlayerCard.card.stats.life -= 1;
        await GameEvents.dispatch(gameInstance, `game:card:lifeChanged:damaged:${currentPlayerCard.card.id}`, {gameCard: currentPlayerCard});
      }
    }

    // Remove life from the player for more than one card discarded
    const damages: number = responseHandIndexes.length - 1;
    if (damages > 0) {
      currentPlayerCard.card.stats.life -= damages;
      await GameEvents.dispatch(gameInstance, `game:card:lifeChanged:damaged:${currentPlayerCard.card.id}`, {gameCard: currentPlayerCard});
    }

    // Dispatch event
    await GameEvents.dispatch(gameInstance, `game:phaseChanged:actions`, {user: gameAction.user});

    return true;
  }

  /**
   * Get the hand indexes of the allowed cards. The user CANNOT discard the "Curse of Mara" card.
   * @param gameInstance
   * @param user
   */
  protected getHandIndexes(gameInstance: IGameInstance, user: number): number[] {
    return gameInstance.cards
      .filter((card: IGameCard) => {
        return card.user === user && card.location === 'hand';
      })
      .map((card: IGameCard, index: number) => card.id !== 'curse-of-mara' ? index : null)
      .filter((i) => i !== null);
  }

}
