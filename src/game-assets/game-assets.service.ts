import { Injectable } from '@nestjs/common';
import { ICard, IGameType, IDeck } from '@thefirstspine/types-game';
import axios from 'axios';

@Injectable()
export class GameAssetsService {

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

  public async list<T>(resource: string): Promise<T[]> {
    const response = await axios.get(`${process.env.GAME_ASSETS_URL}/rest/${resource}`);
    const json = await response.data;
    return json as T[];
  }

  public async single<T>(resource: string, id: string): Promise<T> {
    const response = await axios.get(`${process.env.GAME_ASSETS_URL}/rest/${resource}/${id}`);
    const json = await response.data;
    return json as T;
  }

  public async listAdSingle<T>(resource: string): Promise<T> {
    const response = await axios.get(`${process.env.GAME_ASSETS_URL}/rest/${resource}`);
    const json = await response.data;
    return json as T;
  }
}
