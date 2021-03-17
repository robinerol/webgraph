/**
 * Interface holding the callback for when a node is hovered.
 *
 * @example
 * An example usage.
 * ```
 * const hc: IHoverCallback = {
 *   callback: (key: string) => console.log("hover over " + key),
 * }
 * ```
 *
 * {@label IHoverCallback}
 */
interface IHoverCallback {
  callback: (key: string) => void;
}

export { IHoverCallback };
