import { IGameInstance } from '../game.service';

/**
 * The game events is an event-based model for capture what is occuring in the game. It has
 * an heritage model since the events are like that: `category1:category2:something:event:someid`.
 * In this example the events `category1`, `category1:category2`, `category1:category2:something`,
 * `category1:category2:something:event` and `category1:category2:something:event:someid` are
 * thrown.
 */
export class GameEvents {

  /**
   * The registered subscribers. A subscriber is a callable function that has two arguments: a gameInstance, and an optional
   * object with some useful metadata.
   */
  private static registeredSubscribers: {[identifier: string]: (gameInstance: IGameInstance, params?: any) => Promise<any>} = {};

  /**
   * Subscribe to an event.
   * @param event
   * @param worker
   */
  static subscribe(event: string, worker: (gameInstance: IGameInstance, params?: any) => Promise<any>) {
    GameEvents.registeredSubscribers[event] = worker;
  }

  /**
   * Dispatch an event with the model `category1:category2:something:event:someid`.
   * @param gameInstance
   * @param event
   * @param params
   */
  static async dispatch(gameInstance: IGameInstance, event: string, params?: any) {
    const promises: Array<Promise<boolean>> = [];
    event.split(':').reduce((acc: string, current: string) => {
      acc = (acc === '') ? current : acc + ':' + current;
      if (this.registeredSubscribers[acc]) {
        promises.push(this.registeredSubscribers[acc].bind(this, gameInstance, params).call());
      }
      return acc;
    }, '');
    await Promise.all(promises);
  }

}
