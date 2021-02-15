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
  AppMode,
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
   * Getter returning whether the rendering is active or inactive.
   *
   * @returns true if {@link AppState.ACTIVE}, false if {@link AppState.INACTIVE}
   *
   * @public
   */
  public get isRenderingActive(): boolean {
    return this.appState === AppState.ACTIVE;
  }

  /**
   * Get the currently set mode of the application.
   *
   * @returns Returns the current {@link AppMode}.
   *
   * @public
   */
  public get appMode(): AppMode {
    return <AppMode>this.configuration.getConfig("appMode");
  }

  /**
   * Sets the application mode to the passed {@link AppMode}.
   *
   * @public
   */
  public set appMode(appMode: AppMode) {
    this.configuration.setConfig("appMode", appMode);
  }

  /**
   * Sets and apply layout
   * @param layout
   * @param layoutConfiguration
   */
  public setAndApplyLayout(
    layout: Layout,
    layoutConfiguration: ILayoutConfiguration
  ): void {
    this.configuration.setConfig("layout", layout);
    this.configuration.setConfig("layoutConfiguration", layoutConfiguration);

    this.applyLayout(layout, layoutConfiguration);
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
    if (this.isRenderingActive) throw new Error("Already rendering.");

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

    this.registerEventHandlers();
  }

  /**
   * Destroys the WebGraph.
   *
   * @public
   */
  public destroy(): void {
    this.renderer?.removeAllListeners();
    this.renderer?.getMouseCaptor().removeAllListeners();
    this.renderer?.clear();
    this.renderer?.kill();
    this.appState = AppState.INACTIVE;
  }

  /**---------------------------------------------------------------------------
   * Internal methods.
   *--------------------------------------------------------------------------*/

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
   * Registers all available event handlers.
   *
   * @internal
   */
  private registerEventHandlers(): void {
    if (!this.renderer) return;

    // click listeners
    // this.renderer.on("clickNode", ({ node }) => {
    //   console.log("Click on node: " + node);
    // });

    // this.renderer.on("rightClickNode", ({ node }) => {
    //   console.log("Right click on node: " + node);
    // });

    // hover listeners
    // this.renderer.on("enterNode", ({ node }) => {
    //   console.log("Enter node: " + node);
    // });

    // this.renderer.on("leaveNode", ({ node }) => {
    //   console.log("Leave node: " + node);
    // });

    // drag listener
    this.initializeDragListeners();
  }

  /**
   * This method handles the dragging of nodes. If the {@link AppMode} is set to static,
   * dragging is disabled. When being set to dynamic, nodes can be dragged.
   *
   * @internal
   */
  private initializeDragListeners(): void {
    if (!this.renderer) return;

    const camera = this.renderer.getCamera();
    const mouseCaptor = this.renderer.getMouseCaptor();
    let draggedNode: number | undefined;
    let dragging = false;

    this.renderer.on("downNode", (event) => {
      if (this.appMode === AppMode.STATIC) return;

      dragging = true;
      draggedNode = event.node;
      camera.disable();
    });

    mouseCaptor.on("mouseup", () => {
      if (this.appMode === AppMode.STATIC) return;

      dragging = false;
      draggedNode = undefined;
      camera.enable();
    });

    mouseCaptor.on("mousemove", (e) => {
      if (
        !this.renderer ||
        this.appMode === AppMode.STATIC ||
        !dragging ||
        !draggedNode
      ) {
        return;
      }

      // get new position of node
      const normalizationFunction = this.renderer.normalizationFunction;
      if (normalizationFunction === null) return;

      const pos = normalizationFunction.inverse(
        camera.viewportToGraph(this.renderer, e)
      );

      // set new position of node
      this.graphData.setNodeAttribute(draggedNode, "x", pos.x);
      this.graphData.setNodeAttribute(draggedNode, "y", pos.y);
    });
  }
}

export { WebGraph };
