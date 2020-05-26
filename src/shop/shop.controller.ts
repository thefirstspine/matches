import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ShopService } from './shop.service';
import { AuthGuard } from '../@shared/auth-shared/auth.guard';
import { IShopItem } from '../@shared/rest-shared/entities';
import { RestService } from '../rest/rest.service';
import * as fs from 'fs';

/**
 * Main Shop API
 */
@Controller('shop')
export class ShopController {

  constructor(
    private shopService: ShopService,
    private restService: RestService,
  ) {}

  /**
   * Exchange for resources for a shop item.
   * @param request
   */
  @UseGuards(AuthGuard)
  @Post('exchange')
  async exchange(@Req() request): Promise<IExchangeResult> {
    // Get the shop item
    const item: IShopItem|undefined = await this.restService.shopItem(request.body.shopItemId);

    // Validate currency
    if (!item || item.price.currency === 'eur') {
      return {
        status: false,
        message: 'Invalid item',
      };
    }

    try {
      // Call service
      this.shopService.exchange({
        user: request.user,
        ...item,
      });
      return {
        status: true,
      };
    } catch (e) {
      return {
        status: false,
        message: e.message,
      };
    }
  }

  /**
   * Purchase an item.
   * This will add a payment entity in the shop service.
   * @param request
   */
  @UseGuards(AuthGuard)
  @Post('purchase')
  async purchase(@Req() request): Promise<IPurchaseResult> {
    // Get the shop item
    const item: IShopItem|undefined = await this.restService.shopItem(request.body.shopItemId);

    // Validate currency
    if (!item || item.price.currency !== 'eur') {
      return {
        status: false,
        message: 'Invalid item',
      };
    }

    try {
      // Call service
      const html = await this.shopService.purchase({
        user: request.user,
        ...item,
      });
      return {
        status: true,
        html,
      };
    } catch (e) {
      return {
        status: false,
        message: e.message,
      };
    }
  }

  /**
   * Purchase an item with a third party type "Google Play".
   * This will add a payment entity in the shop service.
   * @param request
   */
  @UseGuards(AuthGuard)
  @Post('purchase/thirdparty/google-play')
  async purchaseThirdPartyGooglePlay(@Req() request): Promise<IPurchaseResult> {
    // Get the shop item
    const item: IShopItem|undefined = await this.restService.shopItem(request.body.shopItemId);

    // Validate product ID
    const googlePlayProductIdsMap = {
      '250-shards': 'fr.thefirstspine.arena.shards.250',
      '500-shards': 'fr.thefirstspine.arena.shards.500',
      '1000-shards': 'fr.thefirstspine.arena.shards.1000',
      '2000-shards': 'fr.thefirstspine.arena.shards.2000',
    };
    const googlePlayProductId: undefined|string = googlePlayProductIdsMap[request.body.shopItemId];
    if (!googlePlayProductId) {
      return {
        status: false,
        message: 'Invalid item',
      };
    }

    try {
      // Call service
      await this.shopService.purchaseThirdPartyGooglePlay(
        { user: request.user, ...item},
        googlePlayProductId,
        request.body.googlePlayToken);
      return {
        status: true,
      };
    } catch (e) {
      return {
        status: false,
        message: e.message,
      };
    }
  }

  @Get('v/success')
  vSuccess() {
    return fs.readFileSync(`${__dirname}/../../assets/arena-shop-success.html`).toString();
  }

  @Get('v/cancel')
  vCancel() {
    return fs.readFileSync(`${__dirname}/../../assets/arena-shop-cancel.html`).toString();
  }

}

export interface IExchangeResult {
  status: boolean;
  message?: string;
}

export interface IPurchaseResult {
  status: boolean;
  message?: string;
  html?: string;
}
