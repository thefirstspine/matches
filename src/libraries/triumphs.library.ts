import { ILocalized } from './generic.library';

// tslint:disable: max-line-length
export class TriumphsLibrary {

  static readonly triumphs: ITriumph[] = [
    {
      id: 'wizzard',
      name: {
        fr: `Sorcier`,
        en: ``,
      },
      description: {
        fr: `Vous avez obtenu vos pouvoirs de sorcier.`,
        en: ``,
      },
    },
    {
      id: 'loyal',
      name: {
        fr: `Loyal`,
        en: ``,
      },
      description: {
        fr: `Vous avez connu Arena avant le 30 octobre 2019.`,
        en: ``,
      },
    },
    {
      id: 'spirit',
      name: {
        fr: `Revenant`,
        en: ``,
      },
      description: {
        fr: `Vous avez bravé la mort.`,
        en: ``,
      },
    },
    {
      id: 'determined',
      name: {
        fr: `Acharné`,
        en: ``,
      },
      description: {
        fr: `Vous avez combattu pendant 7 jours d'affilé.`,
        en: ``,
      },
    },
    {
      id: 'conjurer',
      name: {
        fr: `Illusionniste`,
        en: ``,
      },
      description: {
        fr: `Vous avez gagné un match en tant qu'Illusionniste.`,
        en: ``,
      },
    },
    {
      id: 'summoner',
      name: {
        fr: `Invocateur`,
        en: ``,
      },
      description: {
        fr: `Vous avez gagné un match en tant qu'Invocateur.`,
        en: ``,
      },
    },
    {
      id: 'sorcerer',
      name: {
        fr: `Prestidigitateur`,
        en: ``,
      },
      description: {
        fr: `Vous avez gagné un match en tant que Prestidigitateur.`,
        en: ``,
      },
    },
    {
      id: 'hunter',
      name: {
        fr: `Chasseur`,
        en: ``,
      },
      description: {
        fr: `Vous avez gagné un match en tant que Chasseur.`,
        en: ``,
      },
    },
  ];

  static find(id: string): ITriumph|undefined {
    return this.triumphs.find(e => e.id === id);
  }

}

export interface ITriumph {
  id: string;
  name: ILocalized;
  description: ILocalized;
}
