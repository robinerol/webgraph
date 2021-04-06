/**
 * Various utils.
 */
class Utils {
  /**
   * This function returns the size of a node for a given value.
   *
   * @param value - The value of the node as a number
   * @param minValue - The minimum value of any node in the node-set this function is applied to
   * @param maxValue - The maximum value of any node in the node-set this function is applied to
   * @param [steps] - The amount of different steps of node sizes, must be positive, @defaultValue `3`
   * @param [minNodeSize] - The minimum node size in Pixel, @defaultValue `6`
   * @param [maxNodeSize] - The maximum node size in Pixel, @defaultValue `12`
   *
   * @throws Error - If steps is less or equal to 0
   *
   * @returns - A pixel value representing the size of a node
   *
   * @example
   * An example using the function with just some parameters
   * ```
   * const nodeSize = Utils.getNodeSizeForValue(5, 4, 25);
   * ```
   */
  static getNodeSizeForValue = (
    value: number,
    minValue: number,
    maxValue: number,
    steps = 3,
    minNodeSize = 6,
    maxNodeSize = 12
  ): number => {
    if (steps <= 0) {
      throw new Error("steps must be a positive number");
    }

    const sizeOffset = (maxNodeSize - minNodeSize) / steps;

    const interval = (maxValue - minValue) / steps;

    let section = Math.floor((value - minValue) / interval);
    section = section === steps ? section - 1 : section;

    return minNodeSize + section * sizeOffset;
  };

  /**
   * Returns the color for a node for a given value, based on the min and max value of the nodes set.
   *
   * @param value - The value of the node as a number
   * @param minValue - The minimum value of any node in the node-set this function is applied to
   * @param maxValue - The maximum value of any node in the node-set this function is applied to
   * @param colors - An array of colors as hex strings
   *
   * @returns - A color value as hex string out of the colors input
   *
   * @example
   * An example usage:
   * ```
   * const COLOR_PALETTE = [
   *  "#EDAE49",
   *  "#D1495B",
   *  "#00798C",
   *  "#30638E",
   *  "#003D5B",
   *  "#BBBDF6",
   * ];
   *
   * const color = Utils.getNodeColorForValue(2010, 1999, 2021, COLOR_PALETTE);
   * ```
   */
  static getNodeColorForValue = (
    value: number,
    minValue: number,
    maxValue: number,
    colors: Array<string>
  ): string => {
    const intervalSize = (maxValue - minValue) / colors.length;

    let index = Math.floor((value - minValue) / intervalSize);
    index = index >= colors.length ? index - 1 : index;

    return colors[index];
  };
}

export { Utils };
