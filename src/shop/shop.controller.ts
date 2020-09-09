import { Controller, Post, UseGuards, Req, Get, Param, Body, HttpException } from '@nestjs/common';
import { ShopService, IShopPurchase } from './shop.service';
import { IShopItem } from '@thefirstspine/types-rest';
import { RestService } from '../rest/rest.service';
import * as fs from 'fs';
import { AuthGuard } from '@thefirstspine/auth-nest';
import { ExchangeDto } from './exchange.dto';
import { PurchaseDto } from './purchase.dto';
import { PurchaseGooglePlayDto } from './purchase-google-play.dto';

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
   * @deprecated
   */
  @UseGuards(AuthGuard)
  @Post('exchange')
  async exchange(@Req() request, @Body() body: ExchangeDto): Promise<IExchangeResult> {
    return this.exchangeLoot(request, body);
  }

  /**
   * Trade some resources for other ones that are references under the "loots" shop item's field.
   * @param request
   */
  @UseGuards(AuthGuard)
  @Post('exchange/loot')
  async exchangeLoot(@Req() request, @Body() body: ExchangeDto): Promise<IExchangeResult> {
    // Get the shop item
    const item: IShopItem|undefined = await this.restService.shopItem(body.shopItemId);

    try {
      // Call service
      this.shopService.exchangeLoot({
        user: request.user,
        ...item,
      });
      return {
        status: true,
      };
    } catch (e) {
      throw new HttpException(e.message, 400);
    }
  }

  /**
   * Trade some resources for other ones that are references under the "possibilities" shop item's field.
   * @param request
   */
  @UseGuards(AuthGuard)
  @Post('exchange/possibility')
  async exchangePossibility(@Req() request, @Body() body: ExchangeDto): Promise<IExchangeResult> {
    // Get the shop item
    const item: IShopItem|undefined = await this.restService.shopItem(body.shopItemId);

    try {
      // Call service
      this.shopService.exchangePossibility({
        user: request.user,
        ...item,
      });
      return {
        status: true,
      };
    } catch (e) {
      throw new HttpException(e.message, 400);
    }
  }

  /**
   * Purchase an item.
   * This will add a payment entity in the shop service.
   * @param request
   */
  @UseGuards(AuthGuard)
  @Post('purchase')
  async purchase(@Req() request, @Body() body: PurchaseDto): Promise<IPurchaseResult> {
    // Get the shop item
    const item: IShopItem|undefined = await this.restService.shopItem(body.shopItemId);

    try {
      // Call service
      const purchase: IShopPurchase = await this.shopService.purchase({
        user: request.user,
        ...item,
      });
      const url = `${process.env.ARENA_URL}/shop/v/go/${purchase.timestamp}`;
      return {
        status: true,
        url,
      };
    } catch (e) {
      throw new HttpException(e.message, 400);
    }
  }

  /**
   * Purchase an item with a third party type "Google Play".
   * This will add a payment entity in the shop service.
   * @param request
   */
  @UseGuards(AuthGuard)
  @Post('purchase/thirdparty/google-play')
  async purchaseThirdPartyGooglePlay(@Req() request, @Body() body: PurchaseGooglePlayDto): Promise<IPurchaseResult> {
    // Get the shop item
    const item: IShopItem|undefined = await this.restService.shopItem(body.shopItemId);

    // Validate product ID
    const googlePlayProductIdsMap = {
      '250-shards': 'fr.thefirstspine.arena.shards.250',
      '500-shards': 'fr.thefirstspine.arena.shards.500',
      '1000-shards': 'fr.thefirstspine.arena.shards.1000',
      '2000-shards': 'fr.thefirstspine.arena.shards.2000',
    };
    const googlePlayProductId: undefined|string = googlePlayProductIdsMap[body.shopItemId];
    if (!googlePlayProductId) {
      throw new HttpException('Invalid item', 400);
    }

    try {
      // Call service
      await this.shopService.purchaseThirdPartyGooglePlay(
        { user: request.user, ...item},
        googlePlayProductId,
        body.googlePlayToken);
      return {
        status: true,
      };
    } catch (e) {
      throw new HttpException(e.message, 400);
    }
  }

  @Get('v/go/:t')
  vGo(@Param('t') t: string) {
    const purchase: IShopPurchase = this.shopService.getPaymentByTimestamp(parseInt(t, 10));
    if (purchase?.data?.checkoutCode) {
      return purchase?.data?.checkoutCode;
    }

    return 'Not a goable purchase.';
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
  url?: string;
}
