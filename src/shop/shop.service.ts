import { Injectable } from '@nestjs/common';
import { WizzardService } from '../wizzard/wizzard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import fetch, { Response } from 'node-fetch';
import env from '../@shared/env-shared/env';
import { IWizzard, IWizzardItem } from '../@shared/arena-shared/wizzard';
import { MessagingService } from '../@shared/messaging-shared/messaging.service';
import { IShopItem, ILoot } from '../@shared/rest-shared/entities';
import { LogService } from '../@shared/log-shared/log.service';
import { mergeLootsInItems } from '../utils/game.utils';

@Injectable()
export class ShopService {

  protected shopPurchases: IShopPurchase[] = [];

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly wizzardStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
    private readonly logService: LogService,
  ) {}

  exchange(purchase: IPurchase) {
    // Check for currency
    if (purchase.price.currency !== 'shards') {
      throw new Error('Can only exchange with `shards` currency');
    }

    // Get the wizzard
    const wizzard: IWizzard = this.wizzardService.getWizzard(purchase.user);
    if (purchase.oneTimePurchase && wizzard.purchases.includes(purchase.id)) {
      throw new Error('Already purchased');
    }

    // Gather & check required items
    const itemFrom: IWizzardItem[] = wizzard.items.filter(item => item.name === 'shard');
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
    mergeLootsInItems(wizzard.items, purchase.loots);

    // Add purchase to history
    wizzard.purchases.push(purchase.id);

    // Save wizzard
    this.wizzardStorageService.save(wizzard);
    this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
    this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:shop', purchase);
  }

  async purchase(purchase: IPurchase) {
    // Check for currency
    if (purchase.price.currency !== 'eur') {
      throw new Error('Can only purchase with `eur` currency');
    }

    // Call the shop endpoint
    const body = {
      item: {
        name: 'Achat depuis Arena',
        description: 'Achat depuis Arena',
        price: purchase.price.num * 100,
      },
      successUrl: `${env.config.ARENA_URL}/shop/v/success`,
      cancelUrl: `${env.config.ARENA_URL}/shop/v/cancel`,
    };
    this.logService.info('Send message to shop service', body);
    const result: Response = await fetch(
      env.config.SHOP_URL + '/api/purchase',
      {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Cert': Buffer.from(env.config.SHOP_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
        },
      },
    );

    // Ready result
    const json = await result.json();
    this.logService.info('Response from shop service', json);

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

  async purchaseThirdPartyGooglePlay(purchase: IPurchase, googlePlayProductId: string, googlePlayToken: string) {
    // Call the shop endpoint
    const body = {
      googlePlayProductId,
      googlePlayToken,
    };
    this.logService.info('Send message to shop service', body);
    const result: Response = await fetch(
      env.config.SHOP_URL + '/api/purchase/google-play',
      {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Cert': Buffer.from(env.config.SHOP_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
        },
      },
    );

    // Ready result
    const json = await result.json();
    this.logService.info('Response from shop service', json);

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
      const response: Response = await fetch(
        env.config.SHOP_URL + `/api/payments/${purchase.paymentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Cert': Buffer.from(env.config.SHOP_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
          },
        },
      );
      const responseJson = await response.json();

      // The status is unknown
      if (responseJson.status === 'unknown') {
        // Remove the purchase
        this.logService.warning(`Unknown status for purchase #${purchase.paymentId}`, purchase);
        this.shopPurchases = this.shopPurchases.filter((p: IShopPurchase) => purchase !== p);
        return;
      }

      // The payment failed
      if (responseJson.status === 'failed') {
        // Remove the purchase
        this.logService.info(`Unknown status for purchase #${purchase.paymentId}`, purchase);
        this.shopPurchases = this.shopPurchases.filter((p: IShopPurchase) => purchase !== p);
        return;
      }

      // The payment succeeded
      if (responseJson.status === 'succeeded') {
        // Add the loot
        const wizzard: IWizzard = this.wizzardService.getWizzard(purchase.user);
        mergeLootsInItems(wizzard.items, purchase.loots);
        this.wizzardStorageService.save(wizzard);
        this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
        this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:shop', purchase);

        // Remove the purchase
        this.shopPurchases = this.shopPurchases.filter((p: IShopPurchase) => purchase !== p);

        this.logService.info(`Purchase #${purchase.paymentId} succeeded`, purchase);
        return;
      }
    });

    await Promise.all(promises);
  }

}

export interface IPurchase extends IShopItem {
  user: number;
}

export interface IShopPurchase extends IPurchase {
  timestamp: number;
  paymentId: string;
}
