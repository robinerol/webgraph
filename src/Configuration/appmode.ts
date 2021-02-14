/**
 * Enum representing the available modes of the application.
 *
 * {@label AppMode}
 */
enum AppMode {
  /**
   * The "STATIC" mode disables the functionality to drag nodes and limits the
   * interaction with nodes to the hover functionality.
   *
   * {@label STATIC}
   */
  STATIC = "static",

  /**
   * "DYNAMIC" enables the drag functionality and allows an extended interaction
   * with available nodes.
   *
   * {@label DYNAMIC}
   */
  DYNAMIC = "dynamic",
}

export { AppMode };
