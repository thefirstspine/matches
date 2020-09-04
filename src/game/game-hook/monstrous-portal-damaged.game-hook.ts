import { IGameHook } from './game-hook.interface';
import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameCard, IGameAction, IWizard } from '@thefirstspine/types-arena';
import { IHasGameWorkerService } from '../injections.interface';
import { GameWorkerService } from '../game-worker/game-worker.service';
import { WizzardService } from '../../wizard/wizard.service';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';

/**
 * This subscriber is executed once a 'card:lifeChanged:damaged:monstrous-portal' event is thrown.
 * @param gameInstance
 * @param params
 */
@Injectable()
export class MonstrousPortalDamagedGameHook implements IGameHook, IHasGameWorkerService {

  constructor(
    private readonly wizardService: WizzardService,
    private readonly wizzardsStorageService: WizzardsStorageService,
  ) {}

  public gameWorkerService: GameWorkerService;

  async execute(gameInstance: IGameInstance, params: {gameCard: IGameCard, source: IGameCard, lifeChanged: number}): Promise<boolean> {
    if (params.lifeChanged <= -1) {

      // Unlock title "transporter"
      if (params.source.user === params.gameCard.user) {
        const wizard: IWizard = this.wizardService.getOrCreateWizzard(params.gameCard.user);
        if (wizard && !wizard.triumphs.includes('transporter')) {
          wizard.triumphs.push('transporter');
          this.wizzardsStorageService.save(wizard);
        }
      }

      const action: IGameAction<any> = await this.gameWorkerService.getWorker('monstrous-portal-effect')
        .create(gameInstance, {user: params.gameCard.user});
      if (
        action.interaction.params.boardCoords.length > 0 &&
        action.interaction.params.handIndexes.length > 0
      ) {
        gameInstance.actions.current.push(action);
      }
    }
    return true;
  }

}
