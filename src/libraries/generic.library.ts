export interface ICardCoords {
  x: number;
  y: number;
}

export interface ILocalized {
  fr: string;
  en: string;
}

export declare type destiny = 'conjurer' | 'summoner' | 'sorcerer' | 'hunter';
export declare type origin = 'healer' | 'surgeon' | 'ignorant' | 'architect';
export declare type sideCapacity = 'aura' | 'threat';
export declare type cardCapacity = 'run' | 'grow' | 'death' | 'burdenEarth' | 'treason';
export declare type cardType = 'spell' | 'creature' | 'artifact' | 'player' | 'square';
export declare type cardLocation = 'board' | 'hand' | 'deck' | 'discard' | 'banned';
export declare type cardSide = 'top' | 'left' | 'bottom' | 'right';
