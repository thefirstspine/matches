import { IHistoryItem, IWizzardItem } from '../@shared/arena-shared/wizzard';
import { ILoot } from '../@shared/rest-shared/entities';

/**
 * Get the score of the user based on his history
 * @param history
 */
export function getScore(history: IHistoryItem[]): number {
  return history.reduce((value: number, historyItem: IHistoryItem) => {
      return value + (historyItem.victory ? 3 : -1);
  }, 0);
}

/**
 * Add loots in an item list.
 * @param items
 * @param loot
 */
export function mergeLootsInItems(items: IWizzardItem[], loot: ILoot[]) {
  loot.forEach((loot: ILoot) => {
    const item: IWizzardItem|undefined = items.find((i: IWizzardItem) => i.name === loot.name);
    if (item !== undefined) {
      item.num += loot.num;
    } else {
      items.push(JSON.parse(JSON.stringify(loot)));
    }
  });
}
