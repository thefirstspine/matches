import { Injectable } from '@nestjs/common';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { IWizard } from '@thefirstspine/types-arena';
import { WizzardsStorageService } from '../../storage/wizzards.storage.service';
import { WizzardService } from '../wizard.service';

@Injectable()
export class TriumphService {

  constructor(
    private readonly wizardService: WizzardService,
    private readonly wizzardsStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
  ) {}

  unlockTriumph(user: number, triumph: string) {
    const wizard: IWizard = this.wizardService.getWizard(user);
    const changedWizard: boolean = this.unlockTriumphOnWizard(wizard, triumph);

    if (changedWizard) {
      this.wizzardsStorageService.save(wizard);
    }
  }

  unlockTriumphOnWizard(wizard: IWizard, triumph: string) {
    let changedWizard: boolean = false;
    if (!wizard.triumphs.includes(triumph)) {
      changedWizard = true;
      wizard.triumphs.push(triumph);
      this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:triumph:unlock', triumph);
    }
    return changedWizard;
  }

}
