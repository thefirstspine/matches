import { IHistoryItem } from '../@shared/arena-shared/wizzard';

/**
 * Get the score of the user based on his history
 * @param history
 */
export function getScore(history: IHistoryItem[]): number {
  return history.reduce((value: number, historyItem: IHistoryItem) => {
      return value + (historyItem.victory ? 3 : -1);
  }, 0);
}
