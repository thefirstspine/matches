import { Injectable } from '@nestjs/common';
import { ICard, IGameType, IDeck, IShopItem, IAvatar, ICycle, IQuest } from '@thefirstspine/types-rest';
import fetch, { Response } from 'node-fetch';

@Injectable()
export class RestService {

  public async gameTypes(): Promise<IGameType[]> {
    return this.list('game-types');
  }

  public async decks(): Promise<IDeck[]> {
    return this.list('decks');
  }

  public async card(id: string): Promise<ICard> {
    return this.single('cards', id);
  }

  public async deck(id: string): Promise<IDeck> {
    return this.single('decks', id);
  }

  public async gameType(id: string): Promise<IGameType> {
    return this.single('game-types', id);
  }

  public async shopItem(id: string): Promise<IShopItem> {
    return this.single('shop-items', id);
  }

  public async avatar(id: string): Promise<IAvatar> {
    return this.single('avatars', id);
  }

  public async quests(): Promise<{
    daily: IQuest,
    weekly: IQuest,
  }> {
    return this.listAdSingle('quests');
  }

  public async list<T>(resource: string): Promise<T[]> {
    const response: Response = await fetch(`${process.env.REST_URL}/rest/${resource}`);
    const json = await response.json();
    return json as T[];
  }

  public async single<T>(resource: string, id: string): Promise<T> {
    const response: Response = await fetch(`${process.env.REST_URL}/rest/${resource}/${id}`);
    const json = await response.json();
    return json as T;
  }

  public async listAdSingle<T>(resource: string): Promise<T> {
    const response: Response = await fetch(`${process.env.REST_URL}/rest/${resource}`);
    const json = await response.json();
    return json as T;
  }
}
