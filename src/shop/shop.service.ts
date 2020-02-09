import { Injectable } from '@nestjs/common';
import { WizzardService } from '../wizzard/wizzard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import fetch, { Response } from 'node-fetch';
import env from '../@shared/env-shared/env';
import { IWizzard, IWizzardItem } from '../@shared/arena-shared/wizzard';
import { MessagingService } from '../@shared/messaging-shared/messaging.service';
import { IShopItem, ILoot } from '../@shared/rest-shared/entities';

@Injectable()
export class ShopService {

  protected shopPurchases: IShopPurchase[] = [];

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly wizzardStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
  ) {}

  exchange(purchase: IPurchase) {
    // Get the wizzard
    const wizzard: IWizzard = this.wizzardService.getWizzard(purchase.user);
    if (wizzard.purchases.includes(purchase.id)) {
      throw new Error('Already purchased');
    }

    // Gather & check required items
    const itemFrom: IWizzardItem[] = wizzard.items.filter(item => item.name === purchase.price.currency);
    if (itemFrom.length <= 0 || itemFrom[0].num < purchase.price.num) {
      throw new Error('No sufficient item count');
    }
    itemFrom[0].num -= purchase.price.num;
    wizzard.items = wizzard.items.map((i: IWizzardItem) => {
      return i.name === itemFrom[0].name ?
        itemFrom[0] :
        i;
    });

    // Gather or create item
    purchase.loots.forEach((toSingle: ILoot) => {
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
    wizzard.purchases.push(purchase.id);

    // Save wizzard
    this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
    this.wizzardStorageService.save(wizzard);
  }

  async purchase(purchase: IPurchase) {
    // Check for currency
    if (purchase.price.currency !== 'eur') {
      throw new Error('Can only purchase with `eur` currency');
    }

    // Call the shop endpoint
    const result: Response = await fetch(
      env.config.SHOP_URL + '/api/purchase',
      {
        method: 'post',
        body: JSON.stringify({
          item: {
            name: 'Achat depuis Arena',
            description: 'Achat depuis Arena',
            price: purchase.price.num * 100,
          },
          successUrl: 'https://redirect.tfslocal/success',
          cancelUrl: 'https://redirect.tfslocal/cancel',
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.config.SHOP_TOKEN}`,
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
      const response: Response = await fetch(env.config.SHOP_URL + `/api/payments/${purchase.paymentId}`);
      const json = await response.json();
    });

    return Promise.all(promises);
  }

}

export interface IPurchase extends IShopItem {
  user: number;
}

export interface IShopPurchase extends IPurchase {
  timestamp: number;
  paymentId: string;
}
