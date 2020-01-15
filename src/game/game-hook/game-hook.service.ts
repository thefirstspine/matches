import { Injectable } from '@nestjs/common';
import { MessagingService } from 'src/@shared/messaging-shared/messaging.service';
import { LogService } from 'src/@shared/log-shared/log.service';
import { ArenaRoomsService } from 'src/rooms/arena-rooms.service';
import { RestService } from 'src/rest/rest.service';
import { WizzardService } from 'src/wizzard/wizzard.service';
import { BaseGameService } from '../base.game.service';
import { IGameHook } from './game-hook.interface';
import { IGameInstance } from 'src/@shared/arena-shared/game';
import { CardDamagedGameHook } from './card-damaged.game-hook';
import { CardHealedGameHook } from './card-healed.game-hook';
import { PlayerDamagedGameHook } from './player-damaged.game-hook';
import { PhaseActionsGameHook } from './phase-actions.game-hook';
import { SpellUsedGameHook } from './spell-used.game-hook';
import { TurnEndedGameHook } from './turn-ended.game-hook';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { WizzardsStorageService } from 'src/storage/wizzards.storage.service';

/**
 * Main service that manages game hooks.
 */
@Injectable()
export class GameHookService extends BaseGameService<IGameHook> {

  protected registeredHooks: {[identifier: string]: IGameHook} = {};

  constructor(
    private readonly messagingService: MessagingService,
    private readonly logService: LogService,
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly wizzardsStorageService: WizzardsStorageService,
  ) {
    super();

    // Defer injections for game workers constructions
    this.deferInjection(this.messagingService);
    this.deferInjection(this.logService);
    this.deferInjection(this.wizzardService);
    this.deferInjection(this.restService);
    this.deferInjection(this.arenaRoomsService);
    this.deferInjection(this.wizzardsStorageService);
    this.deferInjection(this); // haya!

    // Defer injection of a new instance because of a circular dependency
    this.deferInjection(new GameWorkerService(
      this.messagingService,
      this.logService,
      this.wizzardService,
      this.restService,
      this.arenaRoomsService,
      this,
      this.wizzardsStorageService,
    ));

    // Create hooks
    this.subscribe('game:card:lifeChanged:damaged:hunter', this.createInjectable(PlayerDamagedGameHook));
    this.subscribe('game:card:lifeChanged:damaged:sorcerer', this.createInjectable(PlayerDamagedGameHook));
    this.subscribe('game:card:lifeChanged:damaged:conjurer', this.createInjectable(PlayerDamagedGameHook));
    this.subscribe('game:card:lifeChanged:damaged:summoner', this.createInjectable(PlayerDamagedGameHook));
    this.subscribe('game:card:lifeChanged:damaged', this.createInjectable(CardDamagedGameHook));
    this.subscribe('game:card:lifeChanged:healed', this.createInjectable(CardHealedGameHook));
    this.subscribe('game:phaseChanged:actions', this.createInjectable(PhaseActionsGameHook));
    this.subscribe('card:spell:used', this.createInjectable(SpellUsedGameHook));
    this.subscribe('game:turnEnded', this.createInjectable(TurnEndedGameHook));
  }

  /**
   * Subscribe to an event.
   * @param event
   * @param worker
   */
  protected subscribe(event: string, hook: IGameHook) {
    this.registeredHooks[event] = hook;
  }

  /**
   * Dispatch an event with the model `category1:category2:something:event:someid`.
   * @param gameInstance
   * @param event
   * @param params
   */
  async dispatch(gameInstance: IGameInstance, event: string, params?: any) {
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
