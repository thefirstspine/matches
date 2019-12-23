import { ILocalized } from './generic.library';

// tslint:disable: max-line-length
export class AvatarsLibrary {

  static readonly avatars: IAvatar[] = [
    {
      id: `mara`,
      name: {
        fr: `Mara, prophétesse d'Exodia`,
        en: ``,
      },
      description: {
        fr: `Mara est l'une des plus puissantes prophétesses d'Exodia. Elle a développé ses dons de prophétesse très jeune et a recemment eu ses pouvoirs d'invocateur. Mère de Volk'ha, elle recherche la Couronne pour de sombres raisons.`,
        en: ``,
      },
    },
    {
      id: `merlin`,
      name: {
        fr: `Merlin, dernier érudit d'Exodia`,
        en: ``,
      },
      description: {
        fr: `Merlin n'a plus sa place en Exodia et il le sait : son combat contre l'obscurantisme de la Foi est perdu. Seule sa quête d'héritage occupe son esprit, déjà bien embrumé par des connaissances interdites.`,
        en: ``,
      },
    },
    {
      id: `insane`,
      name: {
        fr: `Démence, qui n'a pas sa place`,
        en: ``,
      },
      description: {
        fr: `Démence est mort il y a bien longtemps et est enterré dans le Cimetierre Oublié. Sa présence même est un blasphème, et il est recherché activement pour savoir ce qu'il est advenu de la Couronne. Si seulement Démence était revenu avec ses souvenirs...`,
        en: ``,
      },
    },
  ];

  static find(id: string): IAvatar|undefined {
    return this.avatars.find(e => e.id === id);
  }

}

export interface IAvatar {
  id: string;
  name: ILocalized;
  description: ILocalized;
}
