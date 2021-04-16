import { Camera } from "sigma";
import { NodeAttributes } from "sigma/types/types";
import { NodeKey } from "graphology-types";

/**
 * Various public utils.
 *
 * @public
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

    let divider = steps;
    if (divider != 1) {
      divider -= 1;
    }

    const sizeOffset = (maxNodeSize - minNodeSize) / divider;

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

/**
 * Internal utils.
 *
 * @internal
 */
class InternalUtils {
  /**
   * Selects all visible nodes to have a visible label.
   *
   * @param params - Currently visible nodes.
   *
   * @returns - The selected labels.
   */
  static labelSelectorAll(params: { visibleNodes: NodeKey[] }): NodeKey[] {
    return params.visibleNodes;
  }

  /**
   * Selects all nodes with the attribute important set true.
   *
   * @param params - Parameters:
   * - @param cache - Cache storing nodes' data.
   * - @param visibleNodes - Nodes inside the viewport.
   *
   * @returns selector important
   */
  static labelSelectorImportant(params: {
    cache: { [key: string]: NodeAttributes };
    visibleNodes: NodeKey[];
  }): NodeKey[] {
    const importantNodes = Array<NodeKey>();

    for (let i = 0, l = params.visibleNodes.length; i < l; i++) {
      const node = params.visibleNodes[i],
        nodeData = params.cache[node];

      if (nodeData.important) importantNodes.push(node);
    }

    return importantNodes;
  }

  /**
   * Selects which labels to render based on the size of the node and the zoom
   * level of the camera. Labels are being rendered in four zoom levels.
   *
   * @param params - Parameters:
   * - @param cache - Cache storing nodes' data.
   * - @param camera - The renderers camera.
   * - @param displayedLabels - Currently displayed labels.
   * - @param visibleNodes - Nodes inside the viewport.
   *
   * @returns - The selected labels.
   */
  static labelSelectorLevels(params: {
    cache: { [key: string]: NodeAttributes };
    camera: Camera;
    displayedLabels: Set<NodeKey>;
    visibleNodes: NodeKey[];
  }): NodeKey[] {
    const cameraState = params.camera.getState(),
      previousCameraState = params.camera.getPreviousState();

    const previousCamera = new Camera();
    previousCamera.setState(previousCameraState);

    // Camera hasn't moved?
    const still =
      cameraState.x === previousCameraState.x &&
      cameraState.y === previousCameraState.y &&
      cameraState.ratio === previousCameraState.ratio;

    // State
    const zooming = cameraState.ratio < previousCameraState.ratio,
      panning =
        cameraState.x !== previousCameraState.x ||
        cameraState.y !== previousCameraState.y,
      unzooming = cameraState.ratio > previousCameraState.ratio,
      unzoomedPanning = !zooming && !unzooming && cameraState.ratio >= 1,
      zoomedPanning =
        panning && params.displayedLabels.size && !zooming && !unzooming;

    // if panning, return displayed labels
    if (panning || zoomedPanning) Array.from(params.displayedLabels);

    // Trick to discretize unzooming
    if (unzooming && Math.trunc(cameraState.ratio * 100) % 5 !== 0)
      return Array.from(params.displayedLabels);

    // If panning while unzoomed, we shouldn't change label selection
    if ((unzoomedPanning || still) && params.displayedLabels.size !== 0)
      return Array.from(params.displayedLabels);

    // When unzoomed & zooming
    if (zooming && cameraState.ratio >= 1)
      return Array.from(params.displayedLabels);

    // when zoomed out more than ratio 10, display no labels
    if (cameraState.ratio >= 15) return [];

    const worthyNodes: Array<NodeKey> = new Array<NodeKey>();
    const nodes: Record<number, Array<NodeKey>> = {};
    const nodeSizes: Array<number> = new Array<number>();

    // sort the nodes by their size
    params.visibleNodes.forEach((node) => {
      const nodeData = params.cache[node];

      if (nodes[nodeData.size]) {
        nodes[nodeData.size].push(node);
      } else {
        nodes[nodeData.size] = [node];
      }
    });

    // retrieve all different sizes of nodes
    for (const nodeSize in nodes) {
      nodeSizes.push(Number.parseFloat(nodeSize));
    }

    // sort node sizes in descending order
    nodeSizes.sort((a, b) => b - a);

    // if zoomed out, just render the most important labels aka the labels of the largest nodes
    if (cameraState.ratio >= 1.0) {
      worthyNodes.push(...nodes[nodeSizes[0]]);
      return worthyNodes;
    }

    // sort all nodes by size into 4 levels
    const interval = nodeSizes.length / 4;
    let i = 0;

    // level 1
    if (cameraState.ratio < 1.0) {
      while (i < interval) {
        worthyNodes.push(...nodes[nodeSizes[i]]);
        i++;
      }
    }

    // level 2
    if (cameraState.ratio < 0.75) {
      while (i < interval * 2) {
        worthyNodes.push(...nodes[nodeSizes[i]]);
        i++;
      }
    }

    // level 3
    if (cameraState.ratio < 0.5) {
      while (i < interval * 3) {
        worthyNodes.push(...nodes[nodeSizes[i]]);
        i++;
      }
    }

    // level 4
    if (cameraState.ratio < 0.25) {
      while (i < interval * 4) {
        worthyNodes.push(...nodes[nodeSizes[i]]);
        i++;
      }
    }

    return worthyNodes;
  }
}

export { Utils, InternalUtils };
