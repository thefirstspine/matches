import { Injectable } from '@nestjs/common';
import { WizardService } from '../wizard.service';
import { IWizard, IUserQuest } from '@thefirstspine/types-arena';
import { ILoot } from '@thefirstspine/types-rest';
import { mergeLootsInItems } from '../../utils/game.utils';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { TriumphService } from '../triumph/triumph.service';

@Injectable()
export class QuestService {

  constructor(
    private readonly wizardService: WizardService,
    private readonly messagingService: MessagingService,
    private readonly wizzardsStorageService: WizzardsStorageService,
    private readonly triumphService: TriumphService,
  ) {}

  progressQuest(user: number, objectiveType: string, value: number) {
    const wizard: IWizard = this.wizardService.getWizard(user);
    const changedWizard: boolean = this.progressQuestOnWizard(wizard, objectiveType, value);

    if (changedWizard) {
      this.wizzardsStorageService.save(wizard);
    }
  }

  progressQuestOnWizard(wizard: IWizard, objectiveType: string, value: number) {
    const loot: ILoot[] = [];
    let changedWizard: boolean = false;

    wizard.questsProgress.forEach((q: IUserQuest) => {
      if (q.objectiveType === objectiveType) {
        // Add the objective
        q.objectiveCurrent ++;
        changedWizard = true;
        if (q.objectiveCurrent === q.objectiveTarget) {
          // Objective is complete: add the loot & send the message
          loot.push(...q.loots);
          this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:quest:complete', q);
          this.triumphService.unlockTriumphOnWizard(wizard, 'adventurer');
          // Handle quest progress for quest completion
          if (objectiveType !== 'quest') {
            this.progressQuestOnWizard(wizard, 'quest', 1);
          }
        } else {
          this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:quest:progress', q);
        }
      }
    });

    // We have some loot; filter the quests & merge the loot
    if (loot.length > 0) {
      wizard.questsProgress = wizard.questsProgress.filter((q) => q.objectiveCurrent < q.objectiveTarget);
      mergeLootsInItems(wizard.items, loot);
      this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:loot', loot);
    }

    return changedWizard;
  }

}
