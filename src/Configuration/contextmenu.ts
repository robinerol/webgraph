/**
 * Interface for the context menu holding all the context menu
 * items. {@see IContextMenuItem}
 *
 * @param container - The container the context menu will be mounted into
 * @param cssShow - The css class to make the container visible
 * @param cssHide - The css class to hide the container
 * @param xoffset - The x offset to the mouse position to display the container (can be negative)
 * @param yoffset - The y offset to the mouse position to display the container (can be negative)
 * @param entries - A record mapping the 'category' of menu to an array of {@label IContextMenuItem}
 * 
 * @example
 * An example usage.
 * ```
 * const webGraphContextMenuContainer = document.getElementById("webGraphCM");
 * 
 * if (!webGraphContextMenuContainer) {
 *  throw new Error("No div container with the ID 'webGraphCM' has been found.");
 * }
 * 
 * const cm: IContextMenu = {
 *    container: webGraphContextMenuContainer,
 *    cssHide: "hide",
 *    cssShow: "show",
 *    entries: {
 *      0: [
 *        {
 *          label: "drop node",
 *          callback: (key: string) => webGraph?.dropNode(key),
 *          icon: "https://test.test/test.jpg",
 *        },
 *      ],
      },
    }
 * ```
 *
 * {@label IContextMenu}
 */
interface IContextMenu {
  container: HTMLElement;
  cssShow: string;
  cssHide: string;
  xoffset?: number;
  yoffset?: number;
  entries: Record<number, Array<IContextMenuItem>>;
}

/**
 * Interface for the items of a context menu. {@see IContextMenu}
 *
 * @param label - The label of the menu item
 * @param callback - The callback to be executed one the menu item is clicked
 * @param [icon] - the icon to be displayed on the left side of the label
 *
 * @example
 * An example usage.
 * ```
 * const cmitem: IContextMenuItem = {
 *   label: "Delete Node",
 *   callback: (key: string) => console.log("todo: delete node " + key),
 *   icon: "https://example-link.to/fancy_icon.jpg",
 * }
 * ```
 *
 * {@label IContextMenuItem}
 */
interface IContextMenuItem {
  label: string;
  callback: (key: string) => void;
  icon?: string;
}

export { IContextMenu, IContextMenuItem };
