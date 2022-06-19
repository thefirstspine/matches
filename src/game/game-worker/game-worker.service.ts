import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ArenaRoomsService } from '../../rooms/arena-rooms.service';
import { RestService } from '../../rest/rest.service';
import { WizardService } from '../../wizard/wizard.service';
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
import { RunGameWorker } from './run.game-worker';
import { SkipRunGameWorker } from './skip-run.game-worker';
import { SpellReplacementGameWorker } from './spell-replacement.game-worker';
import { ReplaceCardGameWorker } from './replace-card.game-worker';
import { InsanesRunEffectGameWorker } from './insanes-run-effect.game-worker';
import { MonstrousPortalEffectGameWorker } from './monstrous-portal-effect.game-worker';
import { EndTurnGameWorker } from './end-turn.game-worker';
import { VolkaEffectGameWorker } from './volka-effect.game-worker';
import { Fpe2GameWorker } from './fpe/fpe-2';
import { SpellAlterTheFateGameWorker } from './spell-alter-the-fate.game-worker';
import { SpellEtherGameWorker } from './spell-ether.game-worker';
import { SpellFireGameWorker } from './spell-fire.game-worker';
import { SpellAchieveGameWorker } from './spell-achieve.game-worker';
import { Fpe4GameWorker } from './fpe/fpe-4';
import { Fpe6GameWorker } from './fpe/fpe-6';
import { Fpe8GameWorker } from './fpe/fpe-8';
import { Fpe9GameWorker } from './fpe/fpe-9';
import { Fpe11GameWorker } from './fpe/fpe-11';
import { Fpe15GameWorker } from './fpe/fpe-15';
import { Fpe17GameWorker } from './fpe/fpe-17';
import { Fpe18GameWorker } from './fpe/fpe-18';
import { Fpe19GameWorker } from './fpe/fpe-19';
import { Fpe20GameWorker } from './fpe/fpe-20';
import { SpellCureGameWorker } from './spell-cure.game-worker';
import { SpellTheVoidGameWorker } from './spell-the-void.game-worker';
import { SpellPainGameWorker } from './spell-pain.game-worker';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { SpellReinforcementGameWorker } from './spell-reinforcement.game-worker';
import { SpellTrickOrTreatGameWorker } from './spell-trick-or-treat.game-worker';
import { QuestService } from '../../wizard/quest/quest.service';
import { TriumphService } from '../../wizard/triumph/triumph.service';
import { SpellBloodStrengthGameWorker } from './spell-blood-strength.game-worker';
import { SpellMutateFoxGameWorker } from './spell-mutate-fox.game-worker';
import { SpellMutateBansheeGameWorker } from './spell-mutate-banshee.game-worker';
import { SpellMutateBarbedWiresGameWorker } from './spell-mutate-barbers.game-worker';
import { SpellMutateTowerGameWorker } from './spell-mutate-tower.game-worker';
import { SpellInsaneRuinGameWorker } from './spell-insane-ruin.game-worker';
import { SpellInsanePutrefactionGameWorker } from './spell-insane-putrefaction.game-worker';

/**
 * Main service that manages game workers. Each game worker is responsible of a game action type. This service
 * manages too dependency injections with the Injectable decorator to avoir circular dependencies at built-in.
 */
@Injectable()
export class GameWorkerService extends BaseGameService<IGameWorker> {

  protected initialized: boolean = false;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly logsService: LogsService,
    private readonly wizardService: WizardService,
    private readonly restService: RestService,
    private readonly arenaRoomsService: ArenaRoomsService,
    private readonly questService: QuestService,
    private readonly triumphService: TriumphService,
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
    this.deferInjection(this.logsService);
    this.deferInjection(this.wizardService);
    this.deferInjection(this.restService);
    this.deferInjection(this.arenaRoomsService);
    this.deferInjection(this.gameHookService);
    this.deferInjection(this.questService);
    this.deferInjection(this.triumphService);
    this.deferInjection(this); // haya!

    // Create workers
    const injectedProps = {gameWorkerService: this, gameHookService: this.gameHookService};
    this.createInjectable(ConfrontsGameWorker, injectedProps);
    this.createInjectable(MoveCreatureGameWorker, injectedProps);
    this.createInjectable(PlaceCardGameWorker, injectedProps);
    this.createInjectable(SpellHealGameWorker, injectedProps);
    this.createInjectable(SpellPutrefactionGameWorker, injectedProps);
    this.createInjectable(SpellInsanePutrefactionGameWorker, injectedProps);
    this.createInjectable(SpellReconstructGameWorker, injectedProps);
    this.createInjectable(SpellRuinGameWorker, injectedProps);
    this.createInjectable(SpellInsaneRuinGameWorker, injectedProps);
    this.createInjectable(SpellThunderGameWorker, injectedProps);
    this.createInjectable(StartConfrontsGameWorker, injectedProps);
    this.createInjectable(ThrowCardsGameWorker, injectedProps);
    this.createInjectable(RunGameWorker, injectedProps);
    this.createInjectable(SkipRunGameWorker, injectedProps);
    this.createInjectable(SpellReplacementGameWorker, injectedProps);
    this.createInjectable(ReplaceCardGameWorker, injectedProps);
    this.createInjectable(InsanesRunEffectGameWorker, injectedProps);
    this.createInjectable(MonstrousPortalEffectGameWorker, injectedProps);
    this.createInjectable(EndTurnGameWorker, injectedProps);
    this.createInjectable(VolkaEffectGameWorker, injectedProps);
    this.createInjectable(SpellAlterTheFateGameWorker, injectedProps);
    this.createInjectable(SpellEtherGameWorker, injectedProps);
    this.createInjectable(SpellFireGameWorker, injectedProps);
    this.createInjectable(SpellAchieveGameWorker, injectedProps);
    this.createInjectable(Fpe2GameWorker, injectedProps);
    this.createInjectable(Fpe4GameWorker, injectedProps);
    this.createInjectable(Fpe6GameWorker, injectedProps);
    this.createInjectable(Fpe8GameWorker, injectedProps);
    this.createInjectable(Fpe9GameWorker, injectedProps);
    this.createInjectable(Fpe11GameWorker, injectedProps);
    this.createInjectable(Fpe15GameWorker, injectedProps);
    this.createInjectable(Fpe17GameWorker, injectedProps);
    this.createInjectable(Fpe18GameWorker, injectedProps);
    this.createInjectable(Fpe19GameWorker, injectedProps);
    this.createInjectable(Fpe20GameWorker, injectedProps);
    this.createInjectable(SpellCureGameWorker, injectedProps);
    this.createInjectable(SpellTheVoidGameWorker, injectedProps);
    this.createInjectable(SpellPainGameWorker, injectedProps);
    this.createInjectable(SpellReinforcementGameWorker, injectedProps);
    this.createInjectable(SpellTrickOrTreatGameWorker, injectedProps);
    this.createInjectable(SpellBloodStrengthGameWorker, injectedProps);
    this.createInjectable(SpellMutateFoxGameWorker, injectedProps);
    this.createInjectable(SpellMutateBansheeGameWorker, injectedProps);
    this.createInjectable(SpellMutateBarbedWiresGameWorker, injectedProps);
    this.createInjectable(SpellMutateTowerGameWorker, injectedProps);
  }

  /**
   * Get a built game worker.
   * TODO: Add a generic here
   * @param type
   */
  getWorker(type: string): IGameWorker {
    if (!this.initialized) {
      this.init();
    }
    return this.injectables.find((w: IGameWorker) => w.type === type);
  }

}
