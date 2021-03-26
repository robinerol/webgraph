/**
 * Enum representing the available shapes for nodes.
 *
 * {@label NodeShape}
 */
enum NodeShape {
  /**
   * The "RING" shape turns the node into a circle with a white space in the center
   * which makes it appear like a ring.
   *
   * {@label RING}
   */
  RING = "ring",

  /**
   * The "CIRCLE" shape turns the node into basic circle.
   *
   * {@label CIRCLE}
   */
  CIRCLE = "circle",

  /**
   * The "RECTANGLE" shape turns the node into a basic rectangle.
   *
   * {@label RECTANGLE}
   */
  RECTANGLE = "rectangle",

  /**
   * The "TRIANGLE" shape turns the node into a basic triangle.
   *
   * {@label TRIANGLE}
   */
  TRIANGLE = "triangle",
}

export { NodeShape };
