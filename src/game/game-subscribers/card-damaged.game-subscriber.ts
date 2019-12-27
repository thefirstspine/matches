import { IGameInstance, IGameCard } from '../../@shared/arena-shared/game';
import { GameEvents } from './game-events';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
export default async function cardDamagedGameSubscriber(gameInstance: IGameInstance, params: {gameCard: IGameCard}) {
  if (params.gameCard && params.gameCard.card.stats.life <= 0) {
    params.gameCard.location = 'discard';
    await GameEvents.dispatch(gameInstance, `card:discarded:${params.gameCard.card.id}`, {gameCard: params.gameCard});
  }
}
