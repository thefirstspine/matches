import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser } from 'src/@shared/arena-shared/game';
import { RoomsService, IRoom, IRoomCreated, ISender } from './rooms.service';
import { WizzardService } from '../wizzard/wizzard.service';
import { IWizzard } from '../@shared/arena-shared/wizzard';
import { ILocalized } from '../@shared/rest-shared/base';

/**
 * Manages rooms for games inside the rooms service
 */
@Injectable()
export class ArenaRoomsService {

  static readonly SUBJECT: string = 'arena';

  constructor(
      private readonly roomsService: RoomsService,
      private readonly wizzardService: WizzardService,
  ) {}

  /**
   * Creates a room for a given game instance
   * @param game
   */
  async createRoomForGame(game: IGameInstance): Promise<IRoomCreated> {
    const senders: ISender[] = game.users.map((user: IGameUser) => {
      const wizzard: IWizzard = this.wizzardService.getWizzard(user.user);
      return {
        user: user.user,
        displayName: wizzard.name,
      };
    });
    const room: IRoom = {
      name: this.getRoomNameForGame(game),
      senders,
    };
    return this.roomsService.createRoom(
      ArenaRoomsService.SUBJECT,
      room);
  }

  async sendMessageForGame(game: IGameInstance, message: ILocalized, user: number) {
    return this.roomsService.sendMessageToRoom(
      ArenaRoomsService.SUBJECT,
      this.getRoomNameForGame(game),
      {
        message: JSON.stringify(message),
        user,
      });
  }

  /**
   * Get the room name for a given game
   * @param game
   */
  protected getRoomNameForGame(game: IGameInstance): string {
    return `game-${game.id}`;
  }
}
