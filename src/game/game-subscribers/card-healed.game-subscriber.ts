import { IGameInstance, IGameCard } from '../game.service';
import { ICard, CardsLibrary } from '../../libraries/cards.library';

/**
 * This subscriber is executed once a 'game:card:lifeChanged:healed' event is thrown. It will look for cards that
 * has too much life.
 * @param gameInstance
 * @param params
 */
export default async function cardHealedGameSubscriber(gameInstance: IGameInstance, params: {gameCard: IGameCard}) {
  const cardModel: ICard = CardsLibrary.find(params.gameCard.card.id);
  if (params.gameCard.card.stats.life > cardModel.stats.life) {
    params.gameCard.card.stats.life = cardModel.stats.life;
  }
}
