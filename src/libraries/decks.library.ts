import { ILocalized } from './generic.library';
import { ICard, CardsLibrary } from './cards.library';

export class DecksLibrary {

  static readonly decks: IDeck[] = [
    {
      id: `hunter`,
      type: 'destiny',
      name: {
        en: ``,
        fr: `Chasseur simple`,
      },
      description: {
        en: ``,
        fr: `Cette destinée n'a de but que de tester Arena.`,
      },
      cards: [
        CardsLibrary.find('hunter'),
        CardsLibrary.find('heal'),
        CardsLibrary.find('heal'),
        CardsLibrary.find('reconstruct'),
        CardsLibrary.find('reconstruct'),
        CardsLibrary.find('ruin'),
        CardsLibrary.find('ruin'),
        CardsLibrary.find('putrefaction'),
        CardsLibrary.find('putrefaction'),
        CardsLibrary.find('thunder'),
        CardsLibrary.find('thunder'),
        CardsLibrary.find('veneniagora'),
        CardsLibrary.find('veneniagora'),
        CardsLibrary.find('banshee'),
        CardsLibrary.find('banshee'),
        CardsLibrary.find('barbers'),
        CardsLibrary.find('barbers'),
        // Next cards to implement when 'run' is available
          // CardsLibrary.find('fox'),
          // CardsLibrary.find('fox'),
          // CardsLibrary.find('deadly-viper'),
          // CardsLibrary.find('deadly-viper'),
        // Next cards to implement when 'threat' is available
          // CardsLibrary.find('the-tower'),
          // CardsLibrary.find('the-tower'),
          // CardsLibrary.find('gargoyle'),
          // CardsLibrary.find('gargoyle'),
        // Next cards to implement when 'burdenEarth' is available
          // CardsLibrary.find('smoky-totem'),
          // CardsLibrary.find('smoky-totem'),
        // Card with unique effect
          // CardsLibrary.find('replacement'),
          // CardsLibrary.find('replacement'),
        // Card with unique effect
          // CardsLibrary.find('soul-of-a-sacrified-hunter'),
          // CardsLibrary.find('soul-of-a-sacrified-hunter'),
      ],
    },
  ];

  static find(id: string): IDeck|undefined {
    return this.decks.find(e => e.id === id);
  }

}

export interface IDeck {
  id: string;
  name: ILocalized;
  description: ILocalized;
  cards: ICard[];
  type: 'destiny'|'origin'|'expansion';
}
