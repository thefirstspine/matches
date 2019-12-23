import { Controller, Get, Param } from '@nestjs/common';
import { DecksLibrary } from '../libraries/decks.library';
import { CardsLibrary } from '../libraries/cards.library';
import { ShopItemsLibrary } from '../libraries/shop-items.library';
import { TriumphsLibrary } from '../libraries/triumphs.library';
import { AvatarsLibrary } from '../libraries/avatars.library';
import { GamesTypesLibrary } from '../libraries/games-types.library';
import { CyclesLibrary } from '../libraries/cycles.library';
import { WizzardService } from '../wizzard/wizzard.service';

@Controller('rest')
export class RestController {

  constructor(private wizzardService: WizzardService) {}

  @Get('decks')
  getDecks() {
    return DecksLibrary.decks;
  }

  @Get('decks/:id')
  getDeck(@Param('id') id) {
    return DecksLibrary.find(id);
  }

  @Get('cards')
  getCards() {
    return CardsLibrary.cards;
  }

  @Get('cards/:id')
  getCard(@Param('id') id) {
    return CardsLibrary.find(id);
  }

  @Get('shop-items')
  getShopItems() {
    return ShopItemsLibrary.all();
  }

  @Get('shop-items/:id')
  getShopItem(@Param('id') id) {
    return ShopItemsLibrary.find(id);
  }

  @Get('triumphs')
  getTriumphs() {
    return TriumphsLibrary.triumphs;
  }

  @Get('triumphs/:id')
  getTriumph(@Param('id') id) {
    return TriumphsLibrary.find(id);
  }

  @Get('avatars')
  getAvatars() {
    return AvatarsLibrary.avatars;
  }

  @Get('avatars/:id')
  getAvatar(@Param('id') id) {
    return AvatarsLibrary.find(id);
  }

  @Get('game-types')
  getGameTypes() {
    return GamesTypesLibrary.all().map(e => this.removeField(e, 'hooks'));
  }

  @Get('game-types/:id')
  getGameType(@Param('id') id) {
    return this.removeField(GamesTypesLibrary.find(id), 'hooks');
  }

  @Get('cycles/current')
  getCycleCurrent() {
    return CyclesLibrary.current();
  }

  protected removeField(element: any, field: string): any {
    element[field] = undefined;
    return element;
  }

}
