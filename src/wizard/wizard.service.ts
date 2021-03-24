import { Injectable } from '@nestjs/common';
import { IWizard } from '@thefirstspine/types-arena';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wizard, WizardDocument } from './wizard.schema';

/**
 * Service to fetch & migrate some wizards data. Prefere this service instead of getting wizards
 * from storage directly.
 */
@Injectable()
export class WizardService {

  constructor(
    private readonly messagingService: MessagingService,
    @InjectModel(Wizard.name) private wizardModel: Model<WizardDocument>,
  ) {}

  /**
   * Get a wizards from the storage. If not found, returns null.
   * @param user
   * @param withPrivateFields
   */
  private async getWizard(user: number): Promise<IWizard|null> {
    // The user "0" is a default wizard
    if (user === 0) {
      return this.getDefaultWizardData(0);
    }

    const wizard: IWizard|null = await this.wizardModel.findOne({id: user}).exec();
    if (!wizard) {
      return null;
    }

    if (this.migrate(wizard)) {
      this.saveWizard(wizard);
    }

    return wizard;
  }

  /**
   * Create & store basic wizard data. If the file already exists, returns null.
   * @param user
   */
  private async createWizard(user: number): Promise<IWizard> {
    const testWizard = await this.getWizard(user);
    if (testWizard) {
      return null;
    }

    const wizard = this.getDefaultWizardData(user);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:account', wizard);

    await this.wizardModel.create(wizard);

    return wizard;
  }

  async saveWizard(wizard: IWizard): Promise<boolean> {
    const model = await this.wizardModel.updateOne({id: wizard.id}, wizard).exec();
    if (model.ok) {
      return true;
    }

    return false;
  }

  /**
   * Get basic wizard data with blank fields.
   * @param user
   */
  getDefaultWizardData(user: number): IWizard {
    return {
      id: user,
      name: '',
      version: 1.0,
      items: [],
      history: [],
      triumphs: ['wizzard'],
      purchases: [],
      avatar: 'applicant',
      title: 'wizzard',
      friends: [],
      quests: [],
      questsProgress: [],
    };
  }

  /**
   * Migrate a file to the newest version.
   * @param wizzard
   */
  migrate(wizzard: any): boolean {
    let migrated = false;

    wizzard.version = wizzard.version ? wizzard.version : 0.1;

    // Migrate from 0.1 to 0.2 => Add the "history" field
    if (wizzard.version === 0.1) {
      wizzard.version = 0.2;
      migrated = true;
      wizzard.history = [];
    }

    // Migrate from 0.2 to 0.3 => Add the "avatar", "triumphs" & "title" fields
    if (wizzard.version === 0.2) {
      wizzard.version = 0.3;
      migrated = true;
      wizzard.avatar = 'mara';
      wizzard.triumphs = ['wizzard'];
      wizzard.title = 'wizzard';
    }

    // Migrate from 0.3 to 0.4 => remove the "timestamp" field on the items
    if (wizzard.version === 0.3) {
      wizzard.version = 0.4;
      migrated = true;
      wizzard.items = wizzard.items.map((e: any) => {
        return {name: e.name, num: e.num};
      });
    }

    // Migrate from 0.4 to 0.5 => remove the "timestamp" field on the items
    if (wizzard.version === 0.4) {
      wizzard.version = 0.5;
      migrated = true;
      wizzard.items = wizzard.purchases = [];
    }

    // Migrate from 0.5 to 0.6 => added "name" property
    if (wizzard.version === 0.5) {
      wizzard.version = 0.6;
      migrated = true;
      wizzard.name = '';
    }

    // Migrate from 0.6 to 0.7 => added "friends" property
    if (wizzard.version === 0.6) {
      wizzard.version = 0.7;
      migrated = true;
      wizzard.friends = [];
    }

    // Migrate from 0.7 to 0.8 => added "publicRoom" property
    if (wizzard.version === 0.7) {
      wizzard.version = 0.8;
      migrated = true;
      wizzard.publicRoom = null;
    }

    // Migrate from 0.8 to 0.9 => added "publicRoom" property
    if (wizzard.version === 0.8) {
      wizzard.version = 0.9;
      migrated = true;
      wizzard.quests = [];
      wizzard.questsProgress = [];
    }

    // Migrate from 0.8 to 0.9 => added "publicRoom" property
    if (wizzard.version === 0.9) {
      wizzard.version = 1.0;
      migrated = true;
      wizzard.triumphs.push('devoted');
    }

    return migrated;
  }

  async getOrCreateWizard(user: number): Promise<IWizard> {
    // The user "0" is a default wizard
    if (user === 0) {
      return this.getDefaultWizardData(0);
    }

    let wizard: IWizard|null = await this.getWizard(user);
    if (!wizard) {
      wizard = this.getDefaultWizardData(user);
      this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:account', wizard);
      await this.wizardModel.create(wizard);
    }

    if (this.migrate(wizard)) {
      await this.saveWizard(wizard);
    }

    return wizard;
  }

}
