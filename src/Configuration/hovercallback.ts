/**
 * Interface holding the callback for when a node is hovered.
 *
 * @param container - The container the hover data will be mounted into
 * @param cssShow - The css class to make the container visible
 * @param cssHide - The css class to hide the container
 * @param xoffset - The x offset to the mouse position to display the container (can be negative)
 * @param yoffset - The y offset to the mouse position to display the container (can be negative)
 * @param callback - A record mapping the 'category' of hover callback to a callback returning a promise of {@label IHoverContent}
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
 * @param [preheader] - The line above the header
 * @param [header] - The headline of the hover
 * @param [content] - The main content of the hover
 * @param [footer] - The line beneath the main content
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
