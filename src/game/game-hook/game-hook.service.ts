import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { GameAssetsService } from '../../game-assets/game-assets.service';
import { BaseGameService } from '../base.game.service';
import { IGameHook } from './game-hook.interface';
import { IGameInstance } from '@thefirstspine/types-matches';
import { CardDamagedGameHook } from './card-damaged.game-hook';
import { CardHealedGameHook } from './card-healed.game-hook';
import { PlayerDamagedGameHook } from './player-damaged.game-hook';
import { PhaseActionsGameHook } from './phase-actions.game-hook';
import { SpellUsedGameHook } from './spell-used.game-hook';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { CardDestroyedGameHook } from './card-destroyed.game-hook';
import { ActionExecutedGameHook } from './action-executed.game-hook';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { GameCreatedGameHook } from './game-created.game-hook';
import { CardPlacedGameHook } from './card-placed.game-hook';

/**
 * Main service that manages game hooks.
 */
@Injectable()
export class GameHookService extends BaseGameService<IGameHook> {

  protected registeredHooks: {[identifier: string]: IGameHook} = {};

  protected initialized: boolean = false;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly logsService: LogsService,
    private readonly restService: GameAssetsService,
    private readonly arenaRoomsService: ArenaRoomsService,
    @Inject(forwardRef(() => GameWorkerService)) public readonly gameWorkerService: GameWorkerService,
  ) {
    super();
  }

  protected init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    // Defer injections for game workers constructions
    this.deferInjection(this.messagingService);
    this.deferInjection(this.logsService);
    this.deferInjection(this.restService);
    this.deferInjection(this.arenaRoomsService);
    this.deferInjection(this); // haya!

    // Create hooks
    const injectedProps = {gameWorkerService: this.gameWorkerService, gameHookService: this};
    this.subscribe('action:executed', this.createInjectable(ActionExecutedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged', this.createInjectable(CardDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged:player', this.createInjectable(PlayerDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:healed', this.createInjectable(CardHealedGameHook, injectedProps));
    this.subscribe('card:spell:used', this.createInjectable(SpellUsedGameHook, injectedProps));
    this.subscribe('card:destroyed', this.createInjectable(CardDestroyedGameHook, injectedProps));
    this.subscribe('card:placed', this.createInjectable(CardPlacedGameHook, injectedProps));
    this.subscribe('game:phaseChanged:actions', this.createInjectable(PhaseActionsGameHook, injectedProps));
    this.subscribe('game:created', this.createInjectable(GameCreatedGameHook, injectedProps));
  }

  /**
   * Subscribe to an event.
   * @param event
   * @param worker
   */
  protected subscribe(event: string, hook: IGameHook) {
    if (!this.initialized) {
      this.init();
    }
    this.registeredHooks[event] = hook;
  }

  /**
   * Dispatch an event with the model `category1:category2:something:event:someid`.
   * @param gameInstance
   * @param event
   * @param params
   */
  async dispatch(gameInstance: IGameInstance, event: string, params?: any) {
    if (!this.initialized) {
      this.init();
    }
    // this.logsService.info('Dispatch event hook in game instance', { gameInstanceId: gameInstance.id, event, params });
    const promises: Array<Promise<boolean>> = [];
    event.split(':').reduce((acc: string, current: string) => {
      acc = (acc === '') ? current : acc + ':' + current;
      if (this.registeredHooks[acc]) {
        promises.push(this.registeredHooks[acc].execute(gameInstance, params));
      }
      return acc;
    }, '');
    await Promise.all(promises);
  }

}
