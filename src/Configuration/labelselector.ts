/**
 * Enum holding the available label selection strategies.
 *
 * {@label LabelSelector}
 */
enum LabelSelector {
  /**
   * Always selects every node within the viewport.
   *
   * {@label ALL}
   */
  ALL = "all",

  /**
   * Selects nodes in four zoom levels. The most important ones first,
   * down to the least important ones when zooming in.
   *
   * {@label LEVELS}
   */
  LEVELS = "levels",

  /**
   * Selects all nodes which have the attribute important set to true.
   *
   * {@label IMPORTANT}
   */
  IMPORTANT = "important",

  /**
   * Selects nodes according to a grid based heuristic. For further details:
   * {@see https://github.com/robinerol/sigma.js/blob/75ce5e94353f9791aa84176165f801c97b420bee/src/heuristics/labels.ts#L60}
   *
   * {@label SIGMA}
   */
  SIGMA = "sigma",
}

export { LabelSelector };
