/**
 * Give a random interger between two values
 * @param min
 * @param max
 */
export function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * max) + min;
}
