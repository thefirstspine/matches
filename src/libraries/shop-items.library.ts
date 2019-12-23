import { ILocalized } from './generic.library';
import { IWizzardItem } from '../wizzard/wizzard.service';
import { CyclesLibrary } from './cycles.library';

// tslint:disable: max-line-length
export class ShopItemsLibrary {

  static all(): IShopItem[] {
    const shopItems: IShopItem[] = [
      {
        id: '250-shards',
        name: {
          fr: `250 éclats de mana`,
          en: ``,
        },
        description: {
          fr: `250 éclats de mana à ajouter à votre bourse. Vous aurez également droit à un niveau de pledge spécial lors de la campagne de financement participatif. Equivalent en temps de jeu : à peu près 4h.`,
          en: ``,
        },
        categories: ['shards'],
        price: {
          num: 2.5,
          currency: 'eur',
        },
        loots: [
          {name: 'shard', num: 250},
        ],
      },
      {
        id: '500-shards',
        name: {
          fr: `500 éclats de mana`,
          en: ``,
        },
        description: {
          fr: `500 éclats de mana à ajouter à votre bourse. Vous aurez également droit à un niveau de pledge spécial lors de la campagne de financement participatif. Equivalent en temps de jeu : à peu près 8h.`,
          en: ``,
        },
        categories: ['shards', 'featured'],
        price: {
          num: 4.5,
          currency: 'eur',
        },
        loots: [
          {name: 'shard', num: 500},
        ],
      },
      {
        id: '1000-shards',
        name: {
          fr: `1000 éclats de mana`,
          en: ``,
        },
        description: {
          fr: `1000 éclats de mana à ajouter à votre bourse. Vous aurez également droit à un niveau de pledge spécial lors de la campagne de financement participatif. Equivalent en temps de jeu : à peu près 16h.`,
          en: ``,
        },
        categories: ['shards'],
        price: {
          num: 8.5,
          currency: 'eur',
        },
        loots: [
          {name: 'shard', num: 1000},
        ],
      },
      {
        id: '2000-shards',
        name: {
          fr: `2000 éclats de mana`,
          en: ``,
        },
        description: {
          fr: `2000 éclats de mana à ajouter à votre bourse. Vous aurez également droit à un niveau de pledge spécial lors de la campagne de financement participatif. Equivalent en temps de jeu : à peu près 32h.`,
          en: ``,
        },
        categories: ['shards'],
        price: {
          num: 16.5,
          currency: 'eur',
        },
        loots: [
          {name: 'shard', num: 2000},
        ],
      },
    ];

    const index: number = CyclesLibrary.currentNum();
    if (index >= 0) {
      shopItems.push(
        {
          id: 'holo-soul-of-a-sacrified-hunter',
          name: {
            fr: `Âme d'un Chasseur Sacrifié holo`,
            en: ``,
          },
          description: {
            fr: `Débloque la version holographique numérique de Âme d'un Chasseur Sacrifié. Cet article est également une récompense à la participation au tournois pendant le Cycles des Âmes Courronées 2019.`,
            en: ``,
          },
          categories: index === 0 ? ['holos', 'featured'] : ['holos'],
          price: {
            num: 125,
            currency: 'shards',
          },
          loots: [
            {name: 'holo-soul-of-a-sacrified-hunter', num: 1},
          ],
        },
        {
          id: 'holo-hunter',
          name: {
            fr: `Chasseur holo`,
            en: ``,
          },
          description: {
            fr: `Débloque la version holographique numérique de Chasseur`,
            en: ``,
          },
          categories: index === 0 ? ['holos', 'featured'] : ['holos'],
          price: {
            num: 250,
            currency: 'shards',
          },
          loots: [
            {name: 'holo-hunter', num: 1},
          ],
        },
        {
          id: 'style-nostalgy',
          name: {
            fr: `Style nostaglique`,
            en: ``,
          },
          description: {
            fr: `Débloque le style "Nostalgique" sur toutes vos cartes et leur donne un air de prototype.`,
            en: ``,
          },
          categories: index === 0 ? ['styles', 'featured'] : ['styles'],
          price: {
            num: 250,
            currency: 'shards',
          },
          loots: [
            {name: 'style-nostalgy', num: 1},
          ],
        },
      );
    }

    if (index >= 1) {
      // TODO
    }

    return shopItems;
  }

  static find(id: string): IShopItem|undefined {
    return this.all().find(e => e.id === id);
  }

}

export interface IShopItem {
  id: string;
  name: ILocalized;
  description: ILocalized;
  categories: Array<'featured'|'holos'|'styles'|'shards'>;
  price: {
    num: number,
    currency: 'eur'|'shards',
  };
  loots: IWizzardItem[];
}
