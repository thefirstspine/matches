import { Injectable } from '@nestjs/common';
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
  protected async sendRequest<T>(endpoint: string, data: any, method: 'get'|'post' = 'get'): Promise<T|null> {
    this.logService.info('Send message to room service', {endpoint, data});
    const url: string = `${process.env.ROOMS_URL}/api/${endpoint}`;
    const response: Response = await fetch(url, {
      body: JSON.stringify(data),
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Cert': Buffer.from(process.env.ROOMS_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
      },
    });
    const jsonResponse: any = await response.json();
    if (response.status >= 400) {
      this.logService.error('Error from rooms service', jsonResponse);
      return null;
    }
    this.logService.info('Response from rooms service', jsonResponse);
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
