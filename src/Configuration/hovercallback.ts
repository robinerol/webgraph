/**
 * Interface holding the callback for when a node is hovered.
 *
 * @example
 * An example usage.
 * ```
 *
 * const webGraphHoverContainer = document.getElementById("webGraphHC");
 *
 * if (!webGraphHoverContainer) {
 *  throw new Error("No div container with the ID 'webGraphHC' has been found.");
 * }
 *
 * const hc: IHoverCallback = {
 *   container: webGraphHoverContainer,
 *   cssShow: "show",
 *   cssHide: "hide",
 *   callback: async (key: string) => {
 *     const dataJson: any = await fetch(
 *       "http://localhost:9002/node?q=" + key
 *     )
 *       .then((response) => response.json())
 *       .then((json) => json);
 *
 *     if (!dataJson) return { header: "error" };
 *
 *     return {
 *       preheader: dataJson.year,
 *       header: dataJson.originalTitle,
 *       content: dataJson.publisher,
 *      };
 *   },
 * }
 * ```
 *
 * {@label IHoverCallback}
 */
interface IHoverCallback {
  container: HTMLElement;
  cssShow: string;
  cssHide: string;
  xoffset?: number;
  yoffset?: number;
  callback: Record<
    number,
    (key: string, score?: number) => Promise<IHoverContent>
  >;
}

/**
 * Interface representing the content of a box that is being displayed
 * on a hover over a node.
 *
 * {@label IHoverContent}
 */
interface IHoverContent {
  preheader?: string;
  header?: string;
  content?: string;
  footer?: string;
}

export { IHoverCallback, IHoverContent };
