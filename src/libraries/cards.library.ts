import { ILocalized, sideCapacity, cardCapacity, cardType } from './generic.library';
import theTowerCard from './cards/the-tower.card';
import deadlyViperCard from './cards/deadly-viper.card';
import summonerCard from './cards/summoner.card';
import hunterCard from './cards/hunter.card';
import thunderCard from './cards/thunder.card';
import putrefactionCard from './cards/putrefaction';
import ruinCard from './cards/ruin';
import healCard from './cards/heal';
import reconstructCard from './cards/reconstruct';
import replacementCard from './cards/replacement.card';
import smokyTotemCard from './cards/smoky-totem.card';
import barbersCard from './cards/barbers.card';
import gargoyleCard from './cards/gargoyle.card';
import bansheeCard from './cards/banshee.card';
import theFoxCard from './cards/the-fox.card';
import veneniagoraCard from './cards/veneniagora.card';
import soulOfASacrifiedHunterCard from './cards/soul-of-a-sacrified-hunter.card';
import etherCard from './cards/ether';
import eternityGiftCard from './cards/eternity-gift.card';
import hunterSouvenirCard from './cards/hunter-souvenir.card';
import conjurerSouvenirCard from './cards/conjurer-souvenir.card';
import summonerSouvenirCard from './cards/summoner-souvenir.card';
import sorcererSouvenirCard from './cards/sorcerer-souvenir.card';
import snowMansPresentCard from './cards/snow-man-s-present';
import curseOfMaraCard from './cards/curse-of-mara.card';
import burdenEarthCard from './cards/burden-earth';
import ditchCard from './cards/ditch';
import lavaCard from './cards/lava';
import waterCard from './cards/water';

export class CardsLibrary {

  static readonly cards: ICard[] = [
    // Playable cards
    theTowerCard,
    deadlyViperCard,
    summonerCard,
    hunterCard,
    thunderCard,
    putrefactionCard,
    ruinCard,
    healCard,
    reconstructCard,
    replacementCard,
    smokyTotemCard,
    barbersCard,
    gargoyleCard,
    bansheeCard,
    theFoxCard,
    veneniagoraCard,
    soulOfASacrifiedHunterCard,
    etherCard,
    // Curse
    curseOfMaraCard,
    // Collection
    eternityGiftCard,
    hunterSouvenirCard,
    conjurerSouvenirCard,
    summonerSouvenirCard,
    sorcererSouvenirCard,
    snowMansPresentCard,
    // Squares
    burdenEarthCard,
    ditchCard,
    lavaCard,
    waterCard,
  ];

  static find(id: string): ICard|undefined {
    return this.cards.find(e => e.id === id);
  }

}

export interface ICard {
  id: string;
  imageUrl: string;
  name: ILocalized;
  text: ILocalized;
  lore: ILocalized;
  type: cardType;
  stats?: ICardStat;
  art?: string;
}

export interface ICardStat {
  top: ICardSideStat;
  right: ICardSideStat;
  bottom: ICardSideStat;
  left: ICardSideStat;
  life: number;
  capacities?: cardCapacity[];
}

export interface ICardSideStat {
  strenght: number;
  defense: number;
  capacity?: sideCapacity;
}
