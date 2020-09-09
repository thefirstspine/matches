import { Injectable } from '@nestjs/common';
import { WizzardService } from '../wizard/wizard.service';
import { WizzardsStorageService } from '../storage/wizzards.storage.service';
import fetch, { Response } from 'node-fetch';
import { IWizard, IWizardItem } from '@thefirstspine/types-arena';
import { IShopItem, ILoot } from '@thefirstspine/types-rest';
import { mergeLootsInItems } from '../utils/game.utils';
import { LogsService } from '@thefirstspine/logs-nest';
import { MessagingService } from '@thefirstspine/messaging-nest';
import { randBetween } from '../utils/maths.utils';

/**
 * Shop service
 */
@Injectable()
export class ShopService {

  protected shopPurchases: IShopPurchase[] = [];

  constructor(
    private readonly wizzardService: WizzardService,
    private readonly wizzardStorageService: WizzardsStorageService,
    private readonly messagingService: MessagingService,
    private readonly logsService: LogsService,
  ) {}

  /**
   * Exchange a shop item for other items
   * @param purchase
   */
  exchangeLoot(purchase: IPurchase) {
    // Check for currency
    if (purchase.price.find((p) => p.currency === 'eur')) {
      throw new Error('Cannot exchange with `eur` currency');
    }

    // Look items that can be exchanged
    if (purchase.loots.length === 0) {
      throw new Error('Cannot exchange empty shop item');
    }

    // Get the wizzard
    const wizard: IWizard = this.wizzardService.getOrCreateWizzard(purchase.user);

    // Look for already purchased items
    if (purchase.oneTimePurchase && this.hasAlreadyPurchased(wizard, purchase.loots)) {
      throw new Error('Already purchased');
    }

    // Gather & check required items
    purchase.price.forEach((price: {
      num: number;
      currency: string;
    }) => {
        const lookedItem = price.currency === 'shards' ? 'shard' : price.currency;
        const itemFrom: IWizardItem = wizard.items.find(item => item.name === lookedItem);
        if (!itemFrom || itemFrom.num < price.num) {
          throw new Error('No sufficient item count');
        }
    });

    // Gather or create item
    mergeLootsInItems(wizard.items, purchase.price.map((price) => {
      return {name: price.currency === 'shards' ? 'shard' : price.currency, num: -price.num};
    }));
    mergeLootsInItems(wizard.items, purchase.loots);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:loot', purchase.loots);

    // Add purchase to history
    // TODO: Remove this when purchases field is removed from player file
    wizard.purchases.push(purchase.id);

    // Save wizzard
    this.wizzardStorageService.save(wizard);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:account', wizard);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:shop', purchase);
  }

  /**
   * Exchange a shop item for other items
   * @param purchase
   */
  exchangePossibility(purchase: IPurchase) {
    // Check for currency
    if (purchase.price.find((p) => p.currency === 'eur')) {
      throw new Error('Cannot exchange with `eur` currency');
    }

    // Look items that can be exchanged
    if (!purchase.possibleLoots) {
      throw new Error('Cannot exchange non-existant shop item possibility');
    }

    // Get the wizzard
    const wizard: IWizard = this.wizzardService.getOrCreateWizzard(purchase.user);

    // Look for already purchased possibilities
    const possibilities = purchase.possibleLoots.filter((possibility: ILoot[]) => {
      return !this.hasAlreadyPurchased(wizard, possibility);
    });
    if (possibilities.length === 0) {
      throw new Error('Exhausted possibilities');
    }

    // Gather & check required items
    purchase.price.forEach((price: {
      num: number;
      currency: string;
    }) => {
        const lookedItem = price.currency === 'shards' ? 'shard' : price.currency;
        const itemFrom: IWizardItem = wizard.items.find(item => item.name === lookedItem);
        if (!itemFrom || itemFrom.num < price.num) {
          throw new Error('No sufficient item count');
        }
    });

    // Select one possibility
    const possibility: ILoot[] = possibilities[randBetween(0, possibilities.length - 1)];

    // Gather or create item
    mergeLootsInItems(wizard.items, purchase.price.map((price) => {
      return {name: price.currency === 'shards' ? 'shard' : price.currency, num: -price.num};
    }));
    mergeLootsInItems(wizard.items, possibility);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:loot', possibility);

    // Save wizzard
    this.wizzardStorageService.save(wizard);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:account', wizard);
    this.messagingService.sendMessage([wizard.id], 'TheFirstSpine:shop', purchase);
  }

  /**
   * Purchase an item. Only for "eur" currency.
   * @param purchase
   */
  async purchase(purchase: IPurchase): Promise<IShopPurchase|null> {
    // Check for currency
    if (purchase.price.length !== 1) {
      throw new Error('Can only purchase with a single price.');
    }
    if (purchase.price[0].currency !== 'eur') {
      throw new Error('Can only purchase with `eur` currency');
    }

    // Call the shop endpoint
    const body = {
      item: {
        name: 'Achat depuis Arena',
        description: 'Achat depuis Arena',
        price: purchase.price[0].num * 100,
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
        const wizzard: IWizard = this.wizzardService.getOrCreateWizzard(purchase.user);
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

  protected hasAlreadyPurchased(wizard: IWizard, loots: ILoot[]): boolean {
    const firstNotPurchasedItem: ILoot|undefined = loots.find((loot: ILoot) => {
      return (wizard as IWizard).items
        .find((item: IWizardItem) => item.name === loot.name && item.num > 0) !== undefined;
    });

    return firstNotPurchasedItem !== undefined;
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
