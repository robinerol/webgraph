/**
 * Interface holding the callback loading further details of a node.
 *
 * @param container - The container the data will be mounted into
 * @param cssShow - The css class to make the container visible
 * @param cssHide - The css class to hide the container
 * @param xoffset - The x offset to the mouse position to display the container (can be negative)
 * @param yoffset - The y offset to the mouse position to display the container (can be negative)
 * @param callback - A record mapping the 'category' of an info box to a callback returning a promise of {@label INodeInfoContent}
 *
 * @example
 * An example usage.
 * ```
 *
 * const webGraphNodeInfoBox = document.getElementById("webGraphNIB");
 *
 * if (!webGraphNodeInfoBox) {
 *  throw new Error("No div container with the ID 'webGraphNIB' has been found.");
 * }
 *
 * const nib: INodeInfoBox = {
 *   container: webGraphNodeInfoBox,
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
 * {@label INodeInfoBox}
 */
interface INodeInfoBox {
  container: HTMLElement;
  cssShow: string;
  cssHide: string;
  xoffset?: number;
  yoffset?: number;
  callback: Record<
    number,
    (key: string, score?: number) => Promise<INodeInfoContent>
  >;
}

/**
 * Interface representing the content of a box that is being displayed
 * on a hover/click over/on a node.
 *
 * @param [preheader] - The line above the header
 * @param [header] - The headline of the info box
 * @param [content] - The main content of the info box
 * @param [footer] - The line beneath the main content
 *
 * {@label INodeInfoContent}
 */
interface INodeInfoContent {
  preheader?: string;
  header?: string;
  content?: string;
  footer?: string;
}

export { INodeInfoBox, INodeInfoContent };
