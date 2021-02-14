/**
 * Various utils.
 */
class Utils {
  /**
   * This function returns the size of a node for a given value.
   *
   * @param score - The score of the node as a number
   * @param maxScoreValue - The maximum score of any node in the node-set this function is applied to
   * @param maxNodeSize - The maximum node size in Pixel, @defaultValue `10`
   * @returns - A pixel value representing the size of a node
   *
   * @example
   * An example using the function without passing a custom [maxNodeSize]
   * ```
   * const nodeSize = Utils.getNodeSizeForValue(5, 25);
   * ```
   *
   * @example
   * Another example on how to use the function with all parameters
   * ```
   * const nodeSize = Utils.getNodeSizeForValue(5, 25, 10);
   * ```
   */
  static getNodeSizeForValue = (
    score: number,
    maxScoreValue: number,
    maxNodeSize = 10
  ): number => {
    return (score / maxScoreValue) * maxNodeSize;
  };
}

export { Utils };
