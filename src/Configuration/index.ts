import { Layout, ILayoutConfiguration } from "./layouts";
import { AppMode } from "./appmode";
import { IContextMenu } from "./contextmenu";
import { IHoverCallback } from "./hovercallback";

/**
 * Interface for the graphs configurations.
 *
 * {@label IGraphConfiguration}
 */
interface IGraphConfiguration {
  layout: Layout;
  layoutConfiguration: ILayoutConfiguration;
  appMode: AppMode;
  contextMenus?: Record<number, IContextMenu>;
  suppressContextMenu?: boolean;
  hoverCallbacks?: Record<number, IHoverCallback>;
}

/**
 * Representing the default value for the {@link IGraphConfiguration}.
 *
 * {@label defaultGraphConfiguration}
 */
const defaultGraphConfiguration: IGraphConfiguration = {
  layout: Layout.PREDEFINED,
  layoutConfiguration: {
    predefinedLayoutOptions: {},
  },
  appMode: AppMode.STATIC,
  suppressContextMenu: false,
};

/**
 * The GraphConfiguration class is used within the {@link WebGraph} holding the
 * {@link IGraphConfiguration} of the application.
 *
 * {@label GraphConfiguration}
 */
class GraphConfiguration {
  private graphConfigurations: IGraphConfiguration = defaultGraphConfiguration;

  /**
   * Creates an instance of GraphConfiguration by overriting the {@link defaultGraphConfiguration}
   * with the configurations provided by the [providedGraphConfigurations] parameter.
   *
   * @param providedGraphConfigurations - The configurations to apply
   *
   * @example
   * An example where a GraphConfiguration is created with an empty {@link IGraphConfiguration}
   * ```
   * // all configurations stay as defined in {@link defaultGraphConfiguration}
   * new GraphConfiguration({});
   * ```
   *
   * @example
   * An example where a GraphConfiguration is created with a partial {@link IGraphConfiguration}
   * ```
   * // all configurations stay as defined in {@link defaultGraphConfiguration} but the
   * // layout is set to be {@link Layout.RANDOM}
   * new GraphConfiguration({ layout: Layout.RANDOM });
   * ```
   */
  constructor(providedGraphConfigurations: Partial<IGraphConfiguration>) {
    this.graphConfigurations = {
      ...this.graphConfigurations,
      ...providedGraphConfigurations,
    };
  }

  /**
   * Gets the corresponding field of the {@link IGraphConfiguration}.
   *
   * @template T - Type of the {@link IGraphConfiguration}
   *
   * @param fieldName - The field name of the {@link IGraphConfiguration} that should be returned
   * @returns The value of the requested field of the applications {@link IGraphConfiguration}
   */
  public getConfig<T extends keyof IGraphConfiguration>(
    fieldName: T
  ):
    | Layout
    | ILayoutConfiguration
    | AppMode
    | Record<number, IContextMenu>
    | boolean
    | Record<number, IHoverCallback>
    | undefined {
    return this.graphConfigurations[fieldName];
  }

  /**
   * Sets the corresponding field of the {@link IGraphConfiguration}.
   *
   * @template T - Type of the {@link IGraphConfiguration}
   *
   * @param fieldName - The field name of the {@link IGraphConfiguration} that should be set
   * @param value - The new value to set
   * @returns The new value of the requested field of the applications {@link IGraphConfiguration}
   */
  public setConfig<T extends keyof IGraphConfiguration>(
    fieldName: T,
    value: IGraphConfiguration[T]
  ):
    | Layout
    | ILayoutConfiguration
    | AppMode
    | Record<number, IContextMenu>
    | boolean
    | Record<number, IHoverCallback>
    | undefined {
    return (this.graphConfigurations[fieldName] = value);
  }
}

export * from "./layouts";
export * from "./appmode";
export * from "./contextmenu";
export * from "./hovercallback";
export { IGraphConfiguration, GraphConfiguration };
