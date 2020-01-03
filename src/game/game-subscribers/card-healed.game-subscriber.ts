import { IGameInstance, IGameCard, IGameUser } from '../../@shared/arena-shared/game';
import { ICard } from '../../@shared/rest-shared/card';
import { RestService } from '../../rest/rest.service';
import { MessagingService } from '../../messaging/messaging.service';
import { LogService } from '../../@shared/log-shared/log.service';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:healed' event is thrown. It will look for cards that
 * has too much life.
 * @param gameInstance
 * @param params
 */
export default async function cardHealedGameSubscriber(gameInstance: IGameInstance, params: {gameCard: IGameCard, lifeChanged: number}) {
  await (new MessagingService(new LogService('arena'))).sendMessage(
    gameInstance.users.map((u: IGameUser) => u.user),
    `${MessagingService.SUBJECT__GAME}:${gameInstance.id}:cardChanged`,
    {
      changes: {
        life: params.lifeChanged,
      },
      gameCard: params.gameCard,
    });

  const cardModel: ICard = await (new RestService()).card(params.gameCard.card.id);
  if (params.gameCard.card.stats.life > cardModel.stats.life) {
    params.gameCard.card.stats.life = cardModel.stats.life;
  }
}
