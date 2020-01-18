import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { MessagingService } from '../../@shared/messaging-shared/messaging.service';
import { LogService } from '../../@shared/log-shared/log.service';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { RestService } from '../../rest/rest.service';
import { WizzardService } from '../../wizzard/wizzard.service';
import { IGameWorker } from './game-worker.interface';
import { ThrowCardsGameWorker } from './throw-cards.game-worker';
import { MoveCreatureGameWorker } from './move-creature.game-worker';
import { PlaceCardGameWorker } from './place-card.game-worker';
import { SpellHealGameWorker } from './spell-heal.game-worker';
import { SpellPutrefactionGameWorker } from './spell-putrefaction.game-worker';
import { BaseGameService } from '../base.game.service';
import { ConfrontsGameWorker } from './confronts.game-worker';
import { SpellReconstructGameWorker } from './spell-reconstruct.game-worker';
import { SpellRuinGameWorker } from './spell-ruin.game-worker';
import { SpellThunderGameWorker } from './spell-thunder.game-worker';
import { StartConfrontsGameWorker } from './start-confronts.game-worker';
import { GameHookService } from '../game-hook/game-hook.service';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { RunGameWorker } from './run.game-worker';
import { SkipRunGameWorker } from './skip-run.game-worker';

/**
 * Main service that manages game workers. Each game worker is responsible of a game action type. This service
 * manages too dependency injections with the Injectable decorator to avoir circular dependencies at built-in.
 */
@Injectable()
export class GameWorkerService extends BaseGameService<IGameWorker> {

  protected initialized: boolean = false;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly logService: LogService,
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly wizzardsStorageService: WizzardsStorageService,
    @Inject(forwardRef(() => GameHookService)) private readonly gameHookService: GameHookService,
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
    this.deferInjection(this.gameHookService);
    this.deferInjection(this.wizzardsStorageService);
    this.deferInjection(this); // haya!

    // Create workers
    const injectedProps = {gameWorkerService: this, gameHookService: this.gameHookService};
    this.createInjectable(ConfrontsGameWorker, injectedProps);
    this.createInjectable(MoveCreatureGameWorker, injectedProps);
    this.createInjectable(PlaceCardGameWorker, injectedProps);
    this.createInjectable(SpellHealGameWorker, injectedProps);
    this.createInjectable(SpellPutrefactionGameWorker, injectedProps);
    this.createInjectable(SpellReconstructGameWorker, injectedProps);
    this.createInjectable(SpellRuinGameWorker, injectedProps);
    this.createInjectable(SpellThunderGameWorker, injectedProps);
    this.createInjectable(StartConfrontsGameWorker, injectedProps);
    this.createInjectable(ThrowCardsGameWorker, injectedProps);
    this.createInjectable(RunGameWorker, injectedProps);
    this.createInjectable(SkipRunGameWorker, injectedProps);
  }

  /**
   * Get a built game worker.
   * @param type
   */
  getWorker(type: string): IGameWorker {
    if (!this.initialized) {
      this.init();
    }
    return this.injectables.find((w: IGameWorker) => w.type === type);
  }

}
