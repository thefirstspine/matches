import { IGameInstance, IGameCard, IGameUser } from '../../@shared/arena-shared/game';
import { GameEvents } from './game-events';
import { MessagingService } from '../../messaging/messaging.service';
import { LogService } from '../../@shared/log-shared/log.service';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:damaged' event is thrown. It will look for dead
 * cards and place it on the discard.
 * @param gameInstance
 * @param params
 */
export default async function cardDamagedGameSubscriber(gameInstance: IGameInstance, params: {gameCard: IGameCard, lifeChanged: number}) {
  await (new MessagingService(new LogService('arena'))).sendMessage(
    gameInstance.users.map((u: IGameUser) => u.user),
    `${MessagingService.SUBJECT__GAME}:${gameInstance.id}:cardChanged`,
    {
      changes: {
        life: params.lifeChanged,
      },
      gameCard: params.gameCard,
    });

  if (params.gameCard && params.gameCard.card.stats.life <= 0) {
    params.gameCard.location = 'discard';
    await GameEvents.dispatch(gameInstance, `card:discarded:${params.gameCard.card.id}`, {gameCard: params.gameCard});
  }
}
