export class Themes {

  static readonly DEAD_FOREST: string = 'dead-forest';
  static readonly SPINE_S_CAVE: string = 'spine-s-cave';
  static readonly FORGOTTEN_CEMETERY: string = 'forgotten-cemetery';
  static readonly WASTED_FIELDS: string = 'wasted-fields';
  static readonly SACRIFICE_CHURCH: string = 'sacrifice-church';
  static readonly SNOW_MAN_LAIR: string = 'snow-man-lair';

  static get all(): string[] {
    return [
      Themes.DEAD_FOREST,
      Themes.SPINE_S_CAVE,
      Themes.FORGOTTEN_CEMETERY,
      Themes.WASTED_FIELDS,
      Themes.SACRIFICE_CHURCH,
      Themes.SNOW_MAN_LAIR,
    ];
  }

  static get user(): string[] {
    return [
      Themes.DEAD_FOREST,
      Themes.SPINE_S_CAVE,
      Themes.FORGOTTEN_CEMETERY,
      Themes.WASTED_FIELDS,
    ];
  }

}
