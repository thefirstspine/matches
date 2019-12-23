import { IGameInstance, IGameCard, IGameAction } from '../game.service';

/**
 * This subscriber is executed once a 'card:spell:used' event is thrown. It wil delete old spells actions.
 * @param gameInstance
 * @param params
 */
export default async function spellUsedGameSubscriber(gameInstance: IGameInstance, params: {gameCard: IGameCard}) {
  // Get the spells in the hand & delete the associated actions
  // TODO: filter here with an Ether
  gameInstance.cards
    .filter((card: IGameCard) => card.location === 'hand' && card.user === params.gameCard.user && card.card.type === 'spell')
    .forEach((card: IGameCard) => {
      const actions: IGameAction[] = gameInstance.actions.current.filter((a: IGameAction) => a.type === `spell-${card.card.id}`);
      actions.forEach((action: IGameAction) => {
        gameInstance.actions.current = gameInstance.actions.current.filter((a: IGameAction) => a !== action);
        gameInstance.actions.previous.push({
          ...action,
          passedAt: Date.now(),
        });
      });
    });
}
