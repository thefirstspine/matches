import { Injectable } from '@nestjs/common';
import { LogsService } from '@thefirstspine/logs-nest';

/**
 * Service to interact with the TFS' service Rooms. They are public chat
 * rooms built on top of protected subjects.
 */
@Injectable()
export class RoomsService {

  constructor(private readonly driver: IRoomsDriver, private readonly logsService: LogsService) {}

  /**
   * Create a room for a subject.
   * @param subject
   * @param room
   */
  async createRoom(subject: string, room: IRoom): Promise<IRoomCreated> {
    return this.sendRequest<IRoomCreated>(
      `subjects/${subject}/rooms`,
      room,
      'post');
  }

  async joinRoom(subject: string, room: string, sender: ISender): Promise<IRoomCreated> {
    return this.sendRequest<IRoomCreated>(
      `subjects/${subject}/rooms/${room}/senders`,
      sender,
      'post');
  }

  async leaveRoom(subject: string, room: string, user: number): Promise<IRoomCreated> {
    return this.sendRequest<IRoomCreated>(
      `subjects/${subject}/rooms/${room}/senders/${user}`,
      null,
      'delete');
  }

  async sendMessageToRoom(subject: string, room: string, message: IMessage): Promise<IMessageCreated> {
    return this.sendRequest<IMessageCreated>(
      `subjects/${subject}/rooms/${room}/messages/secure`,
      message,
      'post');
  }

  /**
   * Send a request to the Room's API
   * @param endpoint
   * @param data
   * @param method
   */
  protected async sendRequest<T>(endpoint: string, data: any, method: 'get'|'post'|'delete' = 'get'): Promise<T|null> {
    this.logsService.info('Send message to room service', {endpoint, data});
    const response: IRoomsDriverResponse<T> = await this.driver.sendRequest<T>(endpoint, data, method);
    if (response.error) {
      this.logsService.error('Error from rooms service', response.data);
      return null;
    }
    this.logsService.info('Response from rooms service', response.data);
    return response.data as T;
  }

}

export interface IRoom {
  name: string;
  senders: ISender[];
}

export interface IRoomCreated extends IRoom {
  senders: ISenderCreated[];
  timestamp: number;
}

export interface ISender {
  user: number;
  displayName: string;
}

export interface ISenderCreated extends ISender {
  timestamp: number;
}

export interface IMessage {
  message: string;
  user: number;
}

export interface IMessageCreated extends IMessage {
  timestamp: number;
}

export interface IRoomsDriver {
  sendRequest<T>(endpoint: string, data: any, method: 'get'|'post'|'delete'): Promise<IRoomsDriverResponse<T>>;
}

export interface IRoomsDriverResponse<T> {
  error: boolean;
  data: T;
}
