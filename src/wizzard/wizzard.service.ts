import { Injectable } from '@nestjs/common';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import { randBetween } from '../utils/maths.utils';
import { IWizzard } from '../@shared/arena-shared/wizzard';

@Injectable()
export class WizzardService {

  constructor(private readonly wizzardsStorageService: WizzardsStorageService) {}

  getWizzard(user: number): IWizzard {
    let wizzard: IWizzard|null = this.wizzardsStorageService.get(user);
    if (!wizzard) {
      wizzard = {
        id: user,
        name: this.generateWizzardName(),
        version: 0.6,
        items: [],
        history: [],
        triumphs: ['wizzard'],
        purchases: [],
        avatar: ['mara', 'insane', 'merlin'][randBetween(0, 2)],
        title: 'wizzard',
      };
      this.wizzardsStorageService.save(wizzard);
    }

    if (this.migrate(wizzard)) {
      this.wizzardsStorageService.save(wizzard);
    }

    return wizzard;
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
      wizzard.name = this.generateWizzardName();
    }

    return migrated;
  }

  generateWizzardName(): string {
    const dict: string[] = [
      'Urigorim',
      'Crodus',
      'Enitor',
      'Ukey',
      'Kretorn',
      'Ukey',
      'Anofaris',
      'Elvebin',
      'Olvabahn',
      'Vronitor',
      'Omakelis',
      'Puhion',
      'Puharith',
      'Uldor',
      'Uvius',
      'Gevius',
      'Ehion',
      'Azaharis',
      'Irrodelis',
      'Ohaen',
      'Oneas',
      'Onneas',
      'Hivius',
      'Orosim',
      'Ovius',
      'Odel',
      'Opan',
      'Ovior',
      'Ozith',
      'Urrarnas',
    ];
    return dict[randBetween(0, dict.length - 1)];
  }

}
