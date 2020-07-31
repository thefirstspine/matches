export class Themes {

  static readonly DEAD_FOREST: string = 'dead-forest';
  static readonly SPINE_S_CAVE: string = 'spine-s-cave';
  static readonly FORGOTTEN_CEMETERY: string = 'forgotten-cemetery';

  static get all(): string[] {
    return [
      Themes.DEAD_FOREST,
      Themes.SPINE_S_CAVE,
    ];
  }

}
