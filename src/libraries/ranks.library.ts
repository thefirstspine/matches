import { ILocalized } from './generic.library';

export class RanksLibrary {

  static readonly ranks: IRank[] = [
    {
      id: `wizard`,
      name: {
        en: ``,
        fr: `Sorcier`,
      },
      min: Number.MIN_SAFE_INTEGER,
      max: 2,
    },
    {
      id: `hero`,
      name: {
        en: ``,
        fr: `Héroique`,
      },
      min: 2,
      max: 5,
    },
    {
      id: `epic`,
      name: {
        en: ``,
        fr: `Epique`,
      },
      min: 5,
      max: 10,
    },
    {
      id: `mythic`,
      name: {
        en: ``,
        fr: `Mythique`,
      },
      min: 10,
      max: 20,
    },
    {
      id: `legend`,
      name: {
        en: ``,
        fr: `Légende`,
      },
      min: 20,
      max: Number.MAX_SAFE_INTEGER,
    },
  ];

  static find(id: string): IRank|undefined {
    return this.ranks.find(e => e.id === id);
  }

}

export interface IRank {
  id: string;
  name: ILocalized;
  min: number;
  max: number;
}
