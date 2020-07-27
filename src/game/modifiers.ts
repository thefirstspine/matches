export class Modifiers {

  static readonly GREAT_ANCIENTS_EGGS: string = 'great-ancients-eggs';
  static readonly SOUVENIRS_FROM_YOUR_ENEMY: string = 'souvenirs-from-your-enemy';
  static readonly IMMEDIATE: string = 'immediate';
  static readonly DAILY: string = 'daily';
  static readonly CYCLE: string = 'cycle';

  static get all(): string[] {
    return [
      Modifiers.GREAT_ANCIENTS_EGGS,
      Modifiers.SOUVENIRS_FROM_YOUR_ENEMY,
      Modifiers.IMMEDIATE,
      Modifiers.DAILY,
      Modifiers.CYCLE,
    ];
  }

  static get system(): string[] {
    return [
      Modifiers.IMMEDIATE,
      Modifiers.DAILY,
      Modifiers.CYCLE,
    ];
  }

  static get user(): string[] {
    return [
      Modifiers.GREAT_ANCIENTS_EGGS,
      Modifiers.SOUVENIRS_FROM_YOUR_ENEMY,
    ];
  }

}
