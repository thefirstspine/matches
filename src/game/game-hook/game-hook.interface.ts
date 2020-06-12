import { IGameInstance } from '@thefirstspine/types-arena';

/**
 * Main game hook interface. A game hook is an event-based method triggered by calling the GameHookService.
 */
export interface IGameHook {

  execute(gameInstance: IGameInstance, params: any): Promise<boolean>;

}
