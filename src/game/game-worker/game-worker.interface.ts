import { IGameAction, IGameInstance, anySubaction } from '../..//@shared/arena-shared/game';

export interface IGameWorker {

  /**
   * The worker name, commonly the action name the worker is in charge.
   */
  readonly type: string;

  /**
   * Method to create an action (called by the Game service & other workers)
   * @param gameInstance
   */
  create(gameInstance: IGameInstance, data: {[key: string]: any}): Promise<IGameAction<anySubaction>|null>;

  /**
   * This is called for each remaining actions after a possible action succeed and is deleted.
   * @param gameInstance
   * @param gameAction
   */
  refresh(gameInstance: IGameInstance, gameAction: IGameAction<anySubaction>): Promise<void>;

  /**
   * Executes the action. When succeed, this action is deleted & the other actions will be refreshed.
   * @param gameInstance
   * @param gameAction
   */
  execute(gameInstance: IGameInstance, gameAction: IGameAction<anySubaction>): Promise<boolean>;

  /**
   * The action expired. Succeed that to delete it.
   * @param gameInstance
   * @param gameAction
   */
  expires(gameInstance: IGameInstance, gameAction: IGameAction<anySubaction>): Promise<boolean>;

  /**
   * Deleted the action from the instance.
   * @param gameInstance
   * @param gameAction
   */
  delete(gameInstance: IGameInstance, gameAction: IGameAction<anySubaction>): Promise<void>;
}
