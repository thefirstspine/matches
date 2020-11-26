import { Injectable } from '@nestjs/common';
import { LogsService } from '@thefirstspine/logs-nest';
import fetch, { Response } from 'node-fetch';

@Injectable()
export class CalendarService {

  constructor(private readonly logsService: LogsService) {}

  async getPassedCycles(): Promise<ICycle[]> {
    try {
      const date: string = (new Date()).toISOString();
      const response: Response = await fetch(`${process.env.CALENDAR_URL}/cycles?filter=datetimeFrom||lt||${date}`);
      return response.json();
    } catch (e) {
      this.logsService.error(`Cannot fetch cycles`, e);
      return [];
    }
  }

  async getCurrentCycle(): Promise<ICycle|null> {
    try {
      const response: Response = await fetch(`${process.env.CALENDAR_URL}/cycles/current`);
      return response.json();
    } catch (e) {
      this.logsService.error(`Cannot fetch cycle`, e);
      return null;
    }
  }

  async getCurrentEvents(): Promise<IEvent[]> {
    try {
      const date: string = (new Date()).toISOString();
      const response: Response = await fetch(`${process.env.CALENDAR_URL}/events?filter=datetimeFrom||lt||${date}&filter=datetimeTo||gt||${date}`);
      return response.json();
    } catch (e) {
      this.logsService.error(`Cannot fetch events`, e);
      return [];
    }
  }

}

export interface IEvent {
  id: number;
  name: string;
  type: string;
  title_en: string;
  title_fr: string;
  text_en: string;
  text_fr: string;
  datetimeFrom: string;
  datetimeTo: string;
}

export interface ICycle extends Omit<IEvent, 'type'> {
}
