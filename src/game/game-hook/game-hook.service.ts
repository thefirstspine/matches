import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { MessagingService } from '../../@shared/messaging-shared/messaging.service';
import { LogService } from '../../@shared/log-shared/log.service';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { RestService } from '../../rest/rest.service';
import { WizzardService } from '../../wizzard/wizzard.service';
import { BaseGameService } from '../base.game.service';
import { IGameHook } from './game-hook.interface';
import { IGameInstance } from '../../@shared/arena-shared/game';
import { CardDamagedGameHook } from './card-damaged.game-hook';
import { CardHealedGameHook } from './card-healed.game-hook';
import { PlayerDamagedGameHook } from './player-damaged.game-hook';
import { PhaseActionsGameHook } from './phase-actions.game-hook';
import { SpellUsedGameHook } from './spell-used.game-hook';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { CardDestroyedGameHook } from './card-destroyed.game-hook';
import { SoulOfASacrifiedHunterPlacesGameHook } from './soul-of-a-sacrified-hunter-placed.game-hook';
import { ActionExecutedGameHook } from './action-executed.game-hook';
import { TournamentCreatedGameHook } from './tournament-created.game-hook';
import { InsanesRunDestroyedGameHook } from './insanes-run-destroyed.game-hook';
import { MonstrousPortalDamagedGameHook } from './monstrous-portal-damaged.game-hook';
import { VolkhaDestroyedGameHook } from './volkha-destroyed.game-hook';
import { FpeCreatedGameHook } from './fpe/fpe-created.game-hook';
import { GuardianDestroyedGameHook } from './guardian-destroyed.game-hook';
import { CaduceusDestroyedGameHook } from './caduceus-destroyed.game-hook';
import { CaduceusPlacesGameHook } from './caduceus-placed.game-hook';
import { JellyfishDestroyedGameHook } from './jellyfish-destroyed.game-hook';
import { PocketVolcanoDestroyedGameHook } from './pocket-volcano-destroyed.game-hook';
import { ClassicCreatedGameHook } from './classic-created.game-hook';
import { TorturerPlacesGameHook } from './torturer-placed.game-hook';
import { ChimeraPlacesGameHook } from './chimera-placed.game-hook';

/**
 * Main service that manages game hooks.
 */
@Injectable()
export class GameHookService extends BaseGameService<IGameHook> {

  protected registeredHooks: {[identifier: string]: IGameHook} = {};

  protected initialized: boolean = false;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly logService: LogService,
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly wizzardsStorageService: WizzardsStorageService,
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
    this.deferInjection(this.logService);
    this.deferInjection(this.wizzardService);
    this.deferInjection(this.restService);
    this.deferInjection(this.arenaRoomsService);
    this.deferInjection(this.wizzardsStorageService);
    this.deferInjection(this); // haya!

    // Create hooks
    const injectedProps = {gameWorkerService: this.gameWorkerService, gameHookService: this};
    this.subscribe('action:executed', this.createInjectable(ActionExecutedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged', this.createInjectable(CardDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged:hunter', this.createInjectable(PlayerDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged:sorcerer', this.createInjectable(PlayerDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged:conjurer', this.createInjectable(PlayerDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged:summoner', this.createInjectable(PlayerDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:damaged:monstrous-portal', this.createInjectable(MonstrousPortalDamagedGameHook, injectedProps));
    this.subscribe('card:lifeChanged:healed', this.createInjectable(CardHealedGameHook, injectedProps));
    this.subscribe('card:destroyed', this.createInjectable(CardDestroyedGameHook, injectedProps));
    this.subscribe('card:destroyed:insanes-run', this.createInjectable(InsanesRunDestroyedGameHook, injectedProps));
    this.subscribe('card:destroyed:volkha', this.createInjectable(VolkhaDestroyedGameHook, injectedProps));
    this.subscribe('card:spell:used', this.createInjectable(SpellUsedGameHook, injectedProps));
    this.subscribe('card:placed:soul-of-a-sacrified-hunter', this.createInjectable(SoulOfASacrifiedHunterPlacesGameHook, injectedProps));
    this.subscribe('game:created:tournament', this.createInjectable(TournamentCreatedGameHook, injectedProps));
    this.subscribe('game:created:fpe', this.createInjectable(FpeCreatedGameHook, injectedProps));
    this.subscribe('game:created:classic', this.createInjectable(ClassicCreatedGameHook, injectedProps));
    this.subscribe('game:phaseChanged:actions', this.createInjectable(PhaseActionsGameHook, injectedProps));
    this.subscribe('card:destroyed:guardian', this.createInjectable(GuardianDestroyedGameHook, injectedProps));
    this.subscribe('card:destroyed:caduceus', this.createInjectable(CaduceusDestroyedGameHook, injectedProps));
    this.subscribe('card:placed:caduceus', this.createInjectable(CaduceusPlacesGameHook, injectedProps));
    this.subscribe('card:destroyed:jellyfish', this.createInjectable(JellyfishDestroyedGameHook, injectedProps));
    this.subscribe('card:destroyed:pocket-volcano', this.createInjectable(PocketVolcanoDestroyedGameHook, injectedProps));
    this.subscribe('card:placed:torturer', this.createInjectable(TorturerPlacesGameHook, injectedProps));
    this.subscribe('card:placed:chimera', this.createInjectable(ChimeraPlacesGameHook, injectedProps));
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
