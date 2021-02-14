import Graph from "graphology";
import { circlepack, circular, random } from "graphology-layout";
import forceatlas2 from "graphology-layout-forceatlas2";
import { WebGLRenderer } from "sigma";
import { AppState } from "./appstate";
import {
  GraphConfiguration,
  IGraphConfiguration,
  Layout,
  ILayoutConfiguration,
  DEFAULT_FORCEATLAS2_LAYOUT_OPTIONS,
} from "../Configuration";

/**
 * The WebGraph class represents the main endpoint of the module.
 *
 * {@label WebGraph}
 */
class WebGraph {
  private container: HTMLElement;
  private graphData: Graph;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderSettings: Record<string, any>;
  private configuration: GraphConfiguration;
  private appState: AppState = AppState.INACTIVE;
  private renderer: WebGLRenderer | undefined = undefined;

  /**
   * Creates an instance of web graph.
   *
   * @param container - The container where to hook the graph into
   * @param graphData - The graph to be rendered
   * @param [graphConfiguration] - Configurations to be applied. @see {@link IGraphConfiguration} for all available configs.
   * @param [renderSettings] - Render settings to be applied and directly passed to the sigma.js WebGLRenderer. @see {@link https://github.com/jacomyal/sigma.js/blob/v2/src/renderers/webgl/settings.ts} for all available configs.
   *
   * @example
   * An example where just the basic infos are provided
   * ```
   * const container = document.getElementById("container");
   * const graph = new Graph();
   *
   * const webGraph = new WebGraph(container, graph);
   * ```
   *
   * @example
   * An example where all infos are provided
   * ```
   * const container = document.getElementById("container");
   * const graph = new Graph();
   * const graphConfig = {
   *    layout: Layout.FORCEATLAS2,
   *    layoutConfiguration: {
   *        forceAtlas2LayoutOptions: {
   *            iterations: DEFAULT_FORCEATLAS2_ITERATIONS,
   *            preAppliedLayout: Layout.CIRCULAR,
   *        },
   *    },
   * }
   * const renderSettings = {
   *    renderEdgeLabels: true,
   * }
   *
   * const webGraph = new WebGraph(container, graph, graphConfig, renderSettings);
   * ```
   */
  constructor(
    container: HTMLElement,
    graphData: Graph,
    graphConfiguration: Partial<IGraphConfiguration> = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderSettings: Record<string, any> = {}
  ) {
    this.container = container;
    this.graphData = graphData;
    this.configuration = new GraphConfiguration(graphConfiguration);
    this.renderSettings = renderSettings;
  }

  /**
   * Helper function that returns whether the rendering is active or inactive.
   *
   * @returns true if {@link AppState.ACTIVE}, false if {@link AppState.INACTIVE}
   *
   * @public
   */
  public get isActive(): boolean {
    return this.appState === AppState.ACTIVE;
  }

  /**
   * Starts rendering the graph with the provided settings, by applying the
   * selected layout to the graph and initializing the WebGLRenderer provided
   * by sigma.js.
   *
   * @throws Error
   * This is thrown if the rendering is already active.
   *
   * @public
   */
  public render(): void {
    if (this.isActive) throw new Error("Already rendering.");

    this.appState = AppState.ACTIVE;

    this.applyLayout(
      <Layout>this.configuration.getConfig("layout"),
      <ILayoutConfiguration>this.configuration.getConfig("layoutConfiguration")
    );

    this.renderer = new WebGLRenderer(
      this.graphData,
      this.container,
      this.renderSettings
    );
  }

  /**
   * Applies a layout to the graph stored in [graphData]. @see {@link Layout} for all available
   * layouts.
   *
   * @remarks - Regarding {@link Layout.FORCEATLAS2}:
   * If not further defined, all nodes will be pre-layouted using the {@link Layout.CIRCULAR}
   * layout. This can be changed by also passing a {@link ILayoutConfiguration} with a custom
   * {@link IExtendedForceAtlas2LayoutOptions} holding a different {@label Layout} in the
   * [preAppliedLayout] field.
   *
   * @internal
   */
  private applyLayout(
    layout: Layout,
    layoutConfig: ILayoutConfiguration
  ): void {
    switch (layout) {
      case Layout.RANDOM:
        random.assign(this.graphData, layoutConfig.randomLayoutOptions);
        break;

      case Layout.CIRCULAR:
        circular.assign(this.graphData, layoutConfig.circularLayoutOptions);
        break;

      case Layout.CIRCLEPACK:
        circlepack.assign(this.graphData, layoutConfig.circlePackLayoutOptions);
        break;

      case Layout.PREDEFINED:
        // do nothing
        break;

      case Layout.FORCEATLAS2: {
        const forceAtlas2LayoutOptions = layoutConfig.forceAtlas2LayoutOptions;

        // if custom layout options are available
        if (forceAtlas2LayoutOptions) {
          const preAppliedLayout: Layout | undefined =
            forceAtlas2LayoutOptions.preAppliedLayout;

          // if another layout should be pre applied to the ForceAtlas2
          if (preAppliedLayout) {
            if (preAppliedLayout === Layout.FORCEATLAS2) {
              throw new Error(
                "preAppliedLayout for Layout.FORCEATLAS2 can't be Layout.FORCEATLAS2"
              );
            }

            this.applyLayout(
              preAppliedLayout,
              forceAtlas2LayoutOptions.preAppliedLayoutOptions || {}
            );
          }

          forceatlas2.assign(this.graphData, forceAtlas2LayoutOptions);
          break;
        }

        forceatlas2.assign(this.graphData, DEFAULT_FORCEATLAS2_LAYOUT_OPTIONS);
        break;
      }

      default:
        random.assign(this.graphData);
        break;
    }
  }

  /**
   * Destroys the WebGraph.
   *
   * @public
   */
  public destroy(): void {
    this.renderer?.removeAllListeners();
    this.renderer?.clear();
    this.renderer?.kill();
    this.appState = AppState.INACTIVE;
  }
}

export { WebGraph };
