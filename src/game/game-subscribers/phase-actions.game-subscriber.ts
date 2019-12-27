import { IGameInstance, IGameCard, IGameAction } from '../../@shared/arena-shared/game';
import { GameActionWorker } from '../game-action-workers/game-action-worker';
import { MoveCreatureGameActionWorker } from '../game-action-workers/move-creature.game-action-worker';
import { PlaceCardGameActionWorker } from '../game-action-workers/place-card.game-action-worker';
import { StartConfrontsGameActionWorker } from '../game-action-workers/start-confronts.game-action-worker';

/**
 * This subscriber is executed once a 'game:phaseChanged:actions' event is thrown. It will generates the actions
 * for the main phase of the turn (called the "actions phase").
 * @param gameInstance
 * @param params
 */
export default async function phaseActionsGameSubscriber(gameInstance: IGameInstance, params: {user: number}) {
  gameInstance.actions.current.push(
    await GameActionWorker.getActionWorker(PlaceCardGameActionWorker.TYPE).create(gameInstance, {user: params.user}),
    await GameActionWorker.getActionWorker(StartConfrontsGameActionWorker.TYPE).create(gameInstance, {user: params.user}),
    await GameActionWorker.getActionWorker(MoveCreatureGameActionWorker.TYPE).create(gameInstance, {user: params.user}),
  );

  // Get the spells in the hand & create the associated actions
  const promises: Array<Promise<IGameAction>> = [];
  gameInstance.cards.filter((card: IGameCard) => card.location === 'hand' && card.user === params.user && card.card.type === 'spell')
    .forEach((card: IGameCard) => {
      const worker: GameActionWorker|undefined = GameActionWorker.getActionWorker(`spell-${card.card.id}`);
      if (worker) {
        promises.push(worker.create(gameInstance, params));
      }
    });

  const actions: IGameAction[] = await Promise.all(promises);
  gameInstance.actions.current.push(...actions);
}
