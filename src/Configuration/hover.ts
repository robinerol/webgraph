/**
 * Interface holding the callback for when a node is hovered.
 *
 * @example
 * An example usage.
 * ```
 * const hc: IHoverCallback = {
 *   callback: () => { console.log("todo: hover") },
 * }
 * ```
 *
 * {@label IHoverCallback}
 */
interface IHoverCallback {
  callback: () => void;
}

export { IHoverCallback };
