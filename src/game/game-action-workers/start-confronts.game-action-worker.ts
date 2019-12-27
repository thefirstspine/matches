import { GameActionWorker } from './game-action-worker';
import { IGameInstance,
         IGameAction,
         ISubActionSelectCoupleOnBoard} from '../../@shared/arena-shared/game';
import { GameEvents } from '../game-subscribers/game-events';
import { ConfrontsGameActionWorker } from './confronts.game-action-worker';

/**
 * Game action to pass the "actions" phase & start the confrontations.
 */
export class StartConfrontsGameActionWorker extends GameActionWorker {

  static readonly TYPE: string = 'start-confronts';

  /**
   * @inheritdoc
   */
  public async create(gameInstance: IGameInstance, data: {user: number}): Promise<IGameAction> {
    return {
      createdAt: Date.now(),
      type: StartConfrontsGameActionWorker.TYPE,
      description: {
        en: ``,
        fr: `Passer aux confrontations`,
      },
      user: data.user as number,
      priority: 1,
      subactions: [
        {
          type: 'pass',
          description: {
            en: ``,
            fr: `Passer aux confrontations`,
          },
          params: {
          },
        },
      ],
    };
  }

  /**
   * @inheritdoc
   */
  public async execute(gameInstance: IGameInstance, gameAction: IGameAction): Promise<boolean> {
    // Deletes all the current actions
    gameInstance.actions.current.forEach((currentGameAction: IGameAction) => {
      if (currentGameAction !== gameAction) {
        GameActionWorker.getActionWorker(currentGameAction.type).delete(gameInstance, currentGameAction);
      }
    });

    // Dispatch event
    await GameEvents.dispatch(gameInstance, `game:phaseChanged:confonts`);

    // Create the action confront
    const action: IGameAction = await GameActionWorker.getActionWorker(ConfrontsGameActionWorker.TYPE).create(gameInstance, {user: gameAction.user});

    const subactionMove: ISubActionSelectCoupleOnBoard = action.subactions[0] as ISubActionSelectCoupleOnBoard;
    if (subactionMove.params.possibilities.length) {
      // Add the action to the action pool
      gameInstance.actions.current.push(action);
    } else {
      // On empty possibilities, pass to the next user
      await GameEvents.dispatch(gameInstance, `game:turnEnded`, {user: gameAction.user});
    }

    return true;
  }

}
