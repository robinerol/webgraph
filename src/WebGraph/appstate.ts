/**
 * Enum representing the rendering state of the application.
 * The mode of the application is handled within the {@link WebGraph} class.
 *
 * {@label AppState}
 */
enum AppState {
  /**
   * When the {@link AppState} is set to ACTIVE, the application is rendering.
   */
  ACTIVE,

  /**
   * When the {@link AppState} is set to INACTIVE, the application is not rendering.
   */
  INACTIVE,
}

export { AppState };
