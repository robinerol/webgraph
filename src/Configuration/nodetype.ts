/**
 * Enum representing the available types for nodes.
 *
 * {@label NodeType}
 */
enum NodeType {
  /**
   * The "RING" type turns the node into a circle with a white space in the center
   * which makes it appear like a ring.
   *
   * {@label RING}
   */
  RING = "ring",

  /**
   * The "CIRCLE" type turns the node into basic circle.
   *
   * {@label CIRCLE}
   */
  CIRCLE = "circle",

  /**
   * The "RECTANGLE" type turns the node into a basic rectangle.
   *
   * {@label RECTANGLE}
   */
  RECTANGLE = "rectangle",

  /**
   * The "TRIANGLE" type turns the node into a basic triangle.
   *
   * {@label TRIANGLE}
   */
  TRIANGLE = "triangle",
}

export { NodeType };
