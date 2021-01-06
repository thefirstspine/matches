import { Injectable } from '@nestjs/common';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { IWizard } from '@thefirstspine/types-arena';
import { WizardService } from '../wizard.service';

@Injectable()
export class TriumphService {

  constructor(
    private readonly wizardService: WizardService,
    private readonly messagingService: MessagingService,
  ) {}

  async unlockTriumph(user: number, triumph: string) {
    const wizard: IWizard = await this.wizardService.getOrCreateWizard(user);
    const changedWizard: boolean = await this.unlockTriumphOnWizard(wizard, triumph);

    if (changedWizard) {
      this.wizardService.saveWizard(wizard);
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
