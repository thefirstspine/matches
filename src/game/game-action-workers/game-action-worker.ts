import { LogService } from '../../@shared/log-shared/log.service';
import { IGameInstance, IGameAction } from '../../@shared/arena-shared/game';

/**
 * This is a game action. A game action is divided by simple subactions.
 * Please note that object is NOT instantiated in a game instance. This class is
 * a general hook for all instances (yep, with that, a game instance can
 * influate on another one!)
 */
export class GameActionWorker {

  private static registeredActions: {[identifier: string]: GameActionWorker} = {};

  // Constructor with dependency injection
  constructor(protected readonly logService: LogService) {}

  /**
   * Registers an action in the actions pool
   * @param identifier
   * @param action
   */
  public static registerActionWorker(identifier: string, action: GameActionWorker): GameActionWorker {
    GameActionWorker.registeredActions[identifier] = action;
    return action;
  }

  /**
   * Get an action from the actions pool
   * @param identifier
   */
  public static getActionWorker(identifier: string): GameActionWorker|null {
    return GameActionWorker.registeredActions[identifier] ? GameActionWorker.registeredActions[identifier] : null;
  }

  /**
   * Method to create an action (called by the Game service & other workers)
   * @param gameInstance
   */
  public async create(gameInstance: IGameInstance, data: {[key: string]: string|number}): Promise<IGameAction|null> {
    return null;
  }

  /**
   * This is called for each remaining actions after a possible action succeed and is deleted.
   * @param gameInstance
   * @param gameAction
   */
  public async refresh(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    // TODO
  }

  /**
   * Executes the action. When succeed, this action is deleted & the other actions will be refreshed.
   * @param gameInstance
   * @param gameAction
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // TODO
    return false;
  }

  /**
   * The action expired. Succeed that to delete it.
   * @param gameInstance
   * @param gameAction
   */
  public async expires(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // TODO
    return false;
  }

  /**
   * Deleted the action from the instance.
   * @param gameInstance
   * @param gameAction
   */
  public async delete(gameInstance: IGameInstance, gameAction: IGameAction): Promise<void> {
    // TODO
    gameInstance.actions.current = gameInstance.actions.current.filter((gameActionRef: IGameAction) => {
      if (gameActionRef === gameAction) {
        gameInstance.actions.previous.push({
          ...gameAction,
          passedAt: Date.now(),
        });
        return false;
      }
      return true;
    });
  }

}
