import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ShopService } from './shop.service';
import { AuthGuard } from '../@shared/auth-shared/auth.guard';
import { IShopItem } from '../@shared/rest-shared/entities';
import { RestService } from '../rest/rest.service';
import * as fs from 'fs';

@Controller('shop')
export class ShopController {

  constructor(
    private shopService: ShopService,
    private restService: RestService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('exchange')
  async exchange(@Req() request): Promise<IExchangeResult> {
    const item: IShopItem|undefined = await this.restService.shopItem(request.body.shopItemId);
    if (!item || item.price.currency !== 'shards') {
      return {
        status: false,
        message: 'Invalid item',
      };
    }

    try {
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

  @UseGuards(AuthGuard)
  @Post('purchase')
  async purchase(@Req() request): Promise<IPurchaseResult> {
    const item: IShopItem|undefined = await this.restService.shopItem(request.body.shopItemId);
    if (!item || item.price.currency !== 'eur') {
      return {
        status: false,
        message: 'Invalid item',
      };
    }

    try {
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

  @Get('v/success')
  vSuccess() {
    return fs.readFileSync(`${__dirname}/../assets/arena-shop-success.html`).toString();
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
