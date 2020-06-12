import { IWizardHistoryItem, IWizardItem } from '@thefirstspine/types-arena';
import { ILoot } from '@thefirstspine/types-rest';

/**
 * Get the score of the user based on his history
 * @param history
 */
export function getScore(history: IWizardHistoryItem[]): number {
  return history.reduce((value: number, historyItem: IWizardHistoryItem) => {
      return value + (historyItem.victory ? 3 : -1);
  }, 0);
}

/**
 * Add loots in an item list.
 * @param items
 * @param loot
 */
export function mergeLootsInItems(items: IWizardItem[], loot: ILoot[]) {
  loot.forEach((loot: ILoot) => {
    const item: IWizardItem|undefined = items.find((i: IWizardItem) => i.name === loot.name);
    if (item !== undefined) {
      item.num += loot.num;
    } else {
      items.push(JSON.parse(JSON.stringify(loot)));
    }
  });
}
