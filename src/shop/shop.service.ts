import { Injectable } from '@nestjs/common';
import { IWizzardItem, WizzardService, IWizzard } from '../wizzard/wizzard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import fetch, { Response } from 'node-fetch';
import env from '../@shared/env-shared/env';

@Injectable()
export class ShopService {

  protected shopPurchases: IShopPurchase[] = [];

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly wizzardStorageService: WizzardsStorageService,
  ) {}

  exchange(purchase: IPurchase) {
    // Get the wizzard
    const wizzard: IWizzard = this.wizzardService.getWizzard(purchase.user);
    if (wizzard.purchases.includes(purchase.shopItemId)) {
      throw new Error('Already purchased');
    }

    // Gather & check required items
    const itemFrom: IWizzardItem[] = wizzard.items.filter(item => item.name === purchase.from.name);
    if (itemFrom.length <= 0 || itemFrom[0].num < purchase.from.num) {
      throw new Error('No sufficient item count');
    }
    itemFrom[0].num -= purchase.from.num;
    wizzard.items = wizzard.items.map((i: IWizzardItem) => {
      return i.name === itemFrom[0].name ?
        itemFrom[0] :
        i;
    });

    // Gather or create item
    purchase.to.forEach((toSingle: IWizzardItem) => {
      const itemTo: IWizzardItem[] = wizzard.items.filter(item => item.name === toSingle.name);
      if (itemTo.length <= 0) {
        const newItemTo: IWizzardItem = {
          num: 0,
          name: toSingle.name,
        };
        wizzard.items.push(newItemTo);
        itemTo.push(newItemTo);
      }
      itemTo[0].num += toSingle.num;
      wizzard.items = wizzard.items.map((i: IWizzardItem) => {
        return i.name === itemTo[0].name ?
        itemTo[0] :
          i;
      });
    });

    // Add purchase to history
    wizzard.purchases.push(purchase.shopItemId);

    // Save wizzard
    this.wizzardStorageService.save(wizzard);
  }

  async purchase(purchase: IPurchase) {
    // Get the wizzard
    const wizzard: IWizzard = this.wizzardService.getWizzard(purchase.user);
    if (wizzard.purchases.includes(purchase.shopItemId)) {
      throw new Error('Already purchased');
    }

    // Call the shop endpoint
    const result: Response = await fetch(
      env.config.SHOP_INTERNAL_URL + '/api/purchase',
      {
        method: 'post',
        body: JSON.stringify({
          item: {
            name: 'Achat depuis Arena',
            description: 'Achat depuis Arena',
            amount: purchase.from.num * 100,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // Ready result
    const json = await result.json();
    if (json.status) {
      // Save the purchase to the history for further checking
      this.shopPurchases.push({
        ...purchase,
        timestamp: Date.now(),
        paymentId: json.paymentId,
      });
      return json.checkoutCode;
    }
  }

  async lookForCompletePurchases() {
    const promises: Array<Promise<any>> = this.shopPurchases.map(async (purchase: IShopPurchase) => {
      const response: Response = await fetch(env.config.SHOP_INTERNAL_URL + `/api/payments/${purchase.paymentId}`);
      const json = await response.json();
    });

    return Promise.all(promises);
  }

}

export interface IPurchase {
  user: number;
  shopItemId: string;
  from: IWizzardItem;
  to: IWizzardItem[];
}

export interface IShopPurchase extends IPurchase {
  timestamp: number;
  paymentId: string;
}
