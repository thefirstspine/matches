import { Injectable } from '@nestjs/common';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import { randBetween } from '../utils/maths.utils';
import { IWizzard } from '../@shared/arena-shared/wizzard';
import { MessagingService } from '../@shared/messaging-shared/messaging.service';

@Injectable()
export class WizzardService {

  constructor(
    private readonly wizzardsStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
  ) {}

  getWizzard(user: number): IWizzard {
    // The user "0" is a default wizzard
    if (user === 0) {
      return this.getDefaultWizzardData(0);
    }

    let wizzard: IWizzard|null = this.wizzardsStorageService.get(user);
    if (!wizzard) {
      wizzard = this.getDefaultWizzardData(user);
      this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
      this.wizzardsStorageService.save(wizzard);
    }

    if (this.migrate(wizzard)) {
      this.wizzardsStorageService.save(wizzard);
    }

    return wizzard;
  }

  getDefaultWizzardData(user: number): IWizzard {
    return {
      id: user,
      name: '',
      version: 0.6,
      items: [],
      history: [],
      triumphs: ['wizzard'],
      purchases: [],
      avatar: 'applicant',
      title: 'wizzard',
    };
  }

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

    return migrated;
  }

}
