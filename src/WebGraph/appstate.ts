/**
 * Enum representing the rendering state of the application.
 * The mode of the application is handled within the {@link WebGraph} class.
 *
 * {@label AppState}
 */
enum AppState {
  /**
   * When the {@link AppState} is set to ACTIVE, the application is rendering.
   *
   * {@label ACTIVE}
   */
  ACTIVE,

  /**
   * When the {@link AppState} is set to INACTIVE, the application is not rendering.
   *
   * {@label INACTIVE}
   */
  INACTIVE,
}

export { AppState };
