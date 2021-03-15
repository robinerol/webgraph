/**
 * Interface for the context menu holding all the context menu
 * items. {@see IContextMenuItem}
 *
 * @example
 * An example usage.
 * ```
 * const cm: IContextMenu = {
 *   entries: [
 *     {
 *       label: "delete node",
 *       callback: () => {
 *         console.log("todo: delete node");
 *       },
 *       icon: "https://example-link.to/fancy_icon.jpg",
 *     },
 *   ],
 * }
 * ```
 *
 * {@label IContextMenu}
 */
interface IContextMenu {
  entries: Array<IContextMenuItem>;
}

/**
 * Interface for the items of a context menu. {@see IContextMenu}
 *
 * @example
 * An example usage.
 * ```
 * const cmitem: IContextMenuItem = {
 *   label: "Delete Node",
 *   callback: () => { console.log("todo: delete node") },
 *   icon: "https://example-link.to/fancy_icon.jpg",
 * }
 * ```
 *
 * {@label IContextMenuItem}
 */
interface IContextMenuItem {
  label: string;
  callback: () => void;
  icon?: string;
}

export { IContextMenu, IContextMenuItem };
