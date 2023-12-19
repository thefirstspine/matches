import { Injectable } from '@nestjs/common';
import { IGameInstance, IGameUser } from '@thefirstspine/types-matches';
import { RoomsService, IRoom, IRoomCreated, ISender } from './rooms.service';
import { ILocalized } from '@thefirstspine/types-game';

/**
 * Manages rooms for games inside the rooms service
 */
@Injectable()
export class ArenaRoomsService {

  static readonly SUBJECT: string = 'arena';

  constructor(
      private readonly roomsService: RoomsService,
  ) {
    this.roomsService.createRoom(
      ArenaRoomsService.SUBJECT,
      {
        name: 'realm-' + (process.env.REALM ? process.env.REALM : ''),
        senders: [],
      });
  }

  /**
   * Creates a room for a given game instance
   * @param game
   */
  async createRoomForGame(game: IGameInstance): Promise<IRoomCreated> {
    const senders: ISender[] = await Promise.all(game.gameUsers.map(async (user: IGameUser) => {
      return {
        user: user.user,
        displayName: "#" + user.user,
      };
    }));
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

  async joinPublicRoom(user: number, language: 'fr'|'en') {
    return this.roomsService.joinRoom(
      ArenaRoomsService.SUBJECT,
      this.getRoomNameForGeneral(language),
      {
        user,
        displayName: '---',
      });
  }

  async leavePublicRoom(user: number, language: 'fr'|'en') {
    return this.roomsService.leaveRoom(
      ArenaRoomsService.SUBJECT,
      this.getRoomNameForGeneral(language),
      user);
  }

  /**
   * Get the room name for a given game
   * @param game
   */
  protected getRoomNameForGame(game: IGameInstance): string {
    return `game-${game.id}`;
  }

  protected getRoomNameForGeneral(language: 'fr'|'en'): string {
    return `general-${language}`;
  }
}
