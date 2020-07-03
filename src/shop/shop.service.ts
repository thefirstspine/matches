import { Injectable } from '@nestjs/common';
import { WizzardService } from '../wizard/wizard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import fetch, { Response } from 'node-fetch';
import { IWizard, IWizardItem } from '@thefirstspine/types-arena';
import { IShopItem } from '@thefirstspine/types-rest';
import { mergeLootsInItems } from '../utils/game.utils';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';

@Injectable()
export class ShopService {

  protected shopPurchases: IShopPurchase[] = [];

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly wizzardStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
    private readonly logsService: LogsService,
  ) {}

  exchange(purchase: IPurchase) {
    // Check for currency
    if (purchase.price.currency === 'eur') {
      throw new Error('Cannot only exchange with `eur` currency');
    }

    // Get the wizzard
    const wizzard: IWizard = this.wizzardService.getWizzard(purchase.user);
    if (purchase.oneTimePurchase && wizzard.purchases.includes(purchase.id)) {
      throw new Error('Already purchased');
    }

    // Gather & check required items
    const lookedItem = purchase.price.currency === 'shards' ? 'shard' : purchase.price.currency;
    const itemFrom: IWizardItem = wizzard.items.find(item => item.name === lookedItem);
    if (!itemFrom || itemFrom.num < purchase.price.num) {
      throw new Error('No sufficient item count');
    }

    // Gather or create item
    mergeLootsInItems(wizzard.items, [{name: lookedItem, num: -purchase.price.num}]);
    mergeLootsInItems(wizzard.items, purchase.loots);

    // Add purchase to history
    wizzard.purchases.push(purchase.id);

    // Save wizzard
    this.wizzardStorageService.save(wizzard);
    this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
    this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:shop', purchase);
  }

  async purchase(purchase: IPurchase): Promise<IShopPurchase|null> {
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
      successUrl: `${process.env.ARENA_URL}/shop/v/success`,
      cancelUrl: `${process.env.ARENA_URL}/shop/v/cancel`,
    };
    this.logsService.info('Send message to shop service', body);
    const result: Response = await fetch(
      process.env.SHOP_URL + '/api/purchase',
      {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Cert': Buffer.from(process.env.SHOP_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
        },
      },
    );

    // Ready result
    const json = await result.json();
    this.logsService.info('Response from shop service', json);

    if (json.status) {
      // Save the purchase to the history for further checking
      const shopPurchase: IShopPurchase = {
        ...purchase,
        timestamp: Date.now(),
        paymentId: json.paymentId,
        data: json,
      };
      this.shopPurchases.push(shopPurchase);
      return shopPurchase;
    }

    return null;
  }

  getPaymentByTimestamp(timestamp: number): IShopPurchase|undefined {
    return this.shopPurchases.find((p: IShopPurchase) => p.timestamp === timestamp);
  }

  async purchaseThirdPartyGooglePlay(purchase: IPurchase, googlePlayProductId: string, googlePlayToken: string): Promise<IShopPurchase|null> {
    // Call the shop endpoint
    const body = {
      googlePlayProductId,
      googlePlayToken,
    };
    this.logsService.info('Send message to shop service', body);
    const result: Response = await fetch(
      process.env.SHOP_URL + '/api/purchase/google-play',
      {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Cert': Buffer.from(process.env.SHOP_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
        },
      },
    );

    // Ready result
    const json = await result.json();
    this.logsService.info('Response from shop service', json);

    if (json.status) {
      const shopPurchase: IShopPurchase = {
        ...purchase,
        timestamp: Date.now(),
        paymentId: json.paymentId,
      };
      this.shopPurchases.push(shopPurchase);
      return shopPurchase;
    }

    return null;
  }

  async lookForCompletePurchases() {
    const promises: Array<Promise<any>> = this.shopPurchases.map(async (purchase: IShopPurchase) => {
      const response: Response = await fetch(
        process.env.SHOP_URL + `/api/payments/${purchase.paymentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Cert': Buffer.from(process.env.SHOP_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
          },
        },
      );
      const responseJson = await response.json();

      // The status is unknown
      if (responseJson.status === 'unknown') {
        // Remove the purchase
        this.logsService.warning(`Unknown status for purchase #${purchase.paymentId}`, purchase);
        this.shopPurchases = this.shopPurchases.filter((p: IShopPurchase) => purchase !== p);
        return;
      }

      // The payment failed
      if (responseJson.status === 'failed') {
        // Remove the purchase
        this.logsService.info(`Unknown status for purchase #${purchase.paymentId}`, purchase);
        this.shopPurchases = this.shopPurchases.filter((p: IShopPurchase) => purchase !== p);
        return;
      }

      // The payment succeeded
      if (responseJson.status === 'succeeded') {
        // Add the loot
        const wizzard: IWizard = this.wizzardService.getWizzard(purchase.user);
        mergeLootsInItems(wizzard.items, purchase.loots);
        this.wizzardStorageService.save(wizzard);
        this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:account', wizzard);
        this.messagingService.sendMessage([wizzard.id], 'TheFirstSpine:shop', purchase);

        // Remove the purchase
        this.shopPurchases = this.shopPurchases.filter((p: IShopPurchase) => purchase !== p);

        this.logsService.info(`Purchase #${purchase.paymentId} succeeded`, purchase);
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
  data?: any;
}
