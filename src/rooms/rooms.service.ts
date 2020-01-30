import { Injectable } from '@nestjs/common';
import env from '../@shared/env-shared/env';
import fetch, { Response } from 'node-fetch';
import { LogService } from '../@shared/log-shared/log.service';

/**
 * Service to interact with the TFS' service Rooms. They are public chat
 * rooms built on top of protected subjects.
 */
@Injectable()
export class RoomsService {

  constructor(private readonly logService: LogService) {}

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

  async sendMessageToRoom(subject: string, room: string, message: IMessage): Promise<IMessageCreated> {
    return this.sendRequest<IMessageCreated>(
      `subjects/${subject}/rooms/${room}/messages`,
      message,
      'post');
  }

  /**
   * Send a request to the Room's API
   * @param endpoint
   * @param data
   * @param method
   */
  protected async sendRequest<T>(endpoint: string, data: any, method: 'get'|'post' = 'get'): Promise<T> {
    this.logService.info('Send message to room service', {endpoint, data});
    const url: string = `${env.config.ROOMS_URL}/api/${endpoint}`;
    const response: Response = await fetch(url, {
      body: JSON.stringify(data),
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.config.ROOMS_TOKEN}`,
      },
    });
    const jsonResponse: any = await response.json();
    this.logService.info('Response from rooms service', jsonResponse);
    if (response.status >= 400) {
      throw new Error(JSON.stringify(jsonResponse));
    }
    return jsonResponse as T;
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
