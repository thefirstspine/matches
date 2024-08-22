import { IGameCard, IGameInstance } from '@thefirstspine/types-matches';

/**
 * Returns a copy of a card, changing its stats
 * @param card
 * @param gameInstance
 */
export function rotateCard(card: IGameCard, gameInstance: IGameInstance) {
    // Get the current user index
    const currentIndex = gameInstance.gameUsers.findIndex((w) => w.user === card.user);

    // Copy card to not fuck everything
    const copy: IGameCard = JSON.parse(JSON.stringify(card));

    // 180 degrees rotation
    if (currentIndex === 0) {
      copy.currentStats.bottom = JSON.parse(JSON.stringify(card.currentStats.top));
      copy.currentStats.top = JSON.parse(JSON.stringify(card.currentStats.bottom));
    }

    return copy;
}
