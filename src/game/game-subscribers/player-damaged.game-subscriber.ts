import { IGameInstance, IGameCard } from '../../@shared/arena-shared/game';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:damaged:{player}' event is thrown and look for dead
 * players.
 * @param gameInstance
 * @param params
 */
export default async function playerDamagedGameSubscriber(gameInstance: IGameInstance, params: {gameCard: IGameCard}) {
  if (params.gameCard && params.gameCard.card.stats.life <= 0) {
    // TODO: Get the winner
    gameInstance.status = 'ended';
  }
}
