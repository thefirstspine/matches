import { Injectable } from '@nestjs/common';
import { MessagingService } from 'src/@shared/messaging-shared/messaging.service';
import { LogService } from 'src/@shared/log-shared/log.service';
import { ArenaRoomsService } from 'src/rooms/arena-rooms.service';
import { RestService } from 'src/rest/rest.service';
import { WizzardService } from 'src/wizzard/wizzard.service';
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
import { WizzardsStorageService } from 'src/storage/wizzards.storage.service';

/**
 * Main service that manages game workers. Each game worker is responsible of a game action type. This service
 * manages too dependency injections with the Injectable decorator to avoir circular dependencies at built-in.
 */
@Injectable()
export class GameWorkerService extends BaseGameService<IGameWorker> {

  constructor(
    private readonly messagingService: MessagingService,
    private readonly logService: LogService,
    private readonly wizzardService: WizzardService,
    private readonly restService: RestService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly gameHookService: GameHookService,
    private readonly wizzardsStorageService: WizzardsStorageService,
  ) {
    super();

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
    this.createInjectable(ConfrontsGameWorker);
    this.createInjectable(MoveCreatureGameWorker);
    this.createInjectable(PlaceCardGameWorker);
    this.createInjectable(SpellHealGameWorker);
    this.createInjectable(SpellPutrefactionGameWorker);
    this.createInjectable(SpellReconstructGameWorker);
    this.createInjectable(SpellRuinGameWorker);
    this.createInjectable(SpellThunderGameWorker);
    this.createInjectable(StartConfrontsGameWorker);
    this.createInjectable(ThrowCardsGameWorker);
  }

  /**
   * Get a built game worker.
   * @param type
   */
  getWorker(type: string): IGameWorker {
    return this.injectables.find((w: IGameWorker) => w.type === type);
  }

}
