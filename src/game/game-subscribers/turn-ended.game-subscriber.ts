import { IGameInstance, IGameCard, IGameUser, IGameAction } from '../game.service';
import { GameActionWorker } from '../game-action-workers/game-action-worker';
import { ThrowCardsGameActionWorker } from '../game-action-workers/throw-cards.game-action-worker';

export default async function turnEndedGameSubscriber(gameInstance: IGameInstance, params: {user: number}) {
  // Get the index of the next user
  const foundIndex = gameInstance.users.findIndex((u) => u.user === params.user);
  const nextIndex = foundIndex === gameInstance.users.length - 1 ? 0 : foundIndex + 1;

  // Generate the actions of the user
  const action: IGameAction = await GameActionWorker.getActionWorker(ThrowCardsGameActionWorker.TYPE)
    .create(gameInstance, {user: gameInstance.users[nextIndex].user});
  gameInstance.actions.current.push(action);
}
