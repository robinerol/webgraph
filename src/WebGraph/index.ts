import Graph from "graphology";
import {
  SerializedGraph,
  SerializedNode,
  SerializedEdge,
  EdgeKey,
  NodeKey,
} from "graphology-types";
import { circlepack, circular, random } from "graphology-layout";
import forceatlas2 from "graphology-layout-forceatlas2";
import { WebGLRenderer } from "sigma";
import { PartialButFor } from "sigma/types/utils";
import { WebGLSettings } from "sigma/types/renderers/webgl/settings";
import { NodeAttributes, EdgeAttributes } from "sigma/types/types";
import { AppState } from "./appstate";
import {
  GraphConfiguration,
  IGraphConfiguration,
  Layout,
  ILayoutConfiguration,
  DEFAULT_FORCEATLAS2_LAYOUT_OPTIONS,
  AppMode,
  IContextMenu,
  IHoverCallback,
} from "../Configuration";
import drawHover from "./Renderer/hover";
import CustomNodeProgram from "./Program";

/**
 * The WebGraph class represents the main endpoint of the module.
 *
 * {@label WebGraph}
 */
class WebGraph {
  private container: HTMLElement;
  private graphData: Graph;
  private edges: Array<SerializedEdge> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderSettings: Record<string, any>;
  private configuration: GraphConfiguration;
  private appState: AppState = AppState.INACTIVE;
  private renderer: WebGLRenderer | undefined = undefined;
  private highlightedNodes = new Set<NodeKey>();
  private highlightedEdges = new Set<EdgeKey>();

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
   * An example where multiple infos are provided
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
    graphData: Graph | SerializedGraph,
    graphConfiguration: Partial<IGraphConfiguration> = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderSettings: Record<string, any> = {}
  ) {
    this.container = container;

    if (graphData instanceof Graph) {
      this.graphData = graphData;
    } else {
      this.graphData = Graph.from(graphData);
    }

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
   * @param appMode - The {@link AppMode} the application should switch to
   *
   * @public
   */
  public set appMode(appMode: AppMode) {
    this.configuration.setConfig("appMode", appMode);
  }

  /**
   * Sets and applies the required layout to the graph.
   *
   * @param layout - The {@link Layout} to be set and applied
   * @param layoutConfiguration - The {@link ILayoutConfiguration} of the layout
   *
   * @public
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
   * {@see https://github.com/jacomyal/sigma.js/tree/v2}
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

    this.modifyRenderSettings();

    this.renderer = new WebGLRenderer(
      this.graphData,
      this.container,
      this.renderSettings
    );

    this.registerEventHandlers();
  }

  /**
   * Removes all existing edges and replaces them with the given array
   * of edges.
   *
   * @param edges - An array holding the new Graphology.SerializedEdge (s)
   *
   * @public
   */
  public updateEdges(edges: Array<SerializedEdge>): void {
    if (!edges) return;

    this.graphData.clearEdges();
    this.edges = edges;
    this.mergeEdgesIntoGraph();
  }

  /**
   * Changes whether edges are rendered or not.
   *
   * @param renderEdges - if true: renders edges, if false: removes edges
   *
   * @public
   */
  public toggleEdgeRendering(renderEdges: boolean): void {
    if (!renderEdges) {
      if (this.graphData.edges().length <= 0) return;

      if (this.edges.length <= 0) {
        this.graphData.forEachEdge((edge, attributes, source, target) => {
          this.edges.push({
            key: edge,
            source: source,
            target: target,
            attributes: attributes,
          });
        });
      }

      this.graphData.clearEdges();

      return;
    }

    if (this.graphData.edges().length > 0) return;
    this.mergeEdgesIntoGraph();
  }

  /**
   * Adds a node if not present already. If the node exists already,
   * the attributes of the existing and the new node will be merged.
   *
   * @param nodes - An array holding all SerializedNodes to merge into the graph
   *
   * @public
   */
  public mergeNodes(nodes: Array<SerializedNode>): void {
    if (nodes.length <= 0) return;

    nodes.forEach((node) =>
      this.graphData.mergeNode(node.key, node.attributes)
    );

    this.renderer?.refresh();
  }

  /**
   * Drops a node from the graph.
   *
   * @param nodeKey - The key of the node to drop
   *
   * @public
   */
  public dropNode(nodeKey: string): void {
    if (!this.graphData.hasNode(nodeKey)) return;

    // remove node from highlightedNodes set
    if (this.highlightedNodes.has(nodeKey))
      this.highlightedNodes.delete(nodeKey);

    // remove all to the node connected edges that are currently being highlighted
    // from the highlightedEdges set
    const edges = this.graphData.edges(nodeKey);
    edges.forEach((edge) => {
      if (this.highlightedEdges.has(edge)) {
        this.highlightedEdges.delete(edge);
      }
    });

    // drop the node and refresh
    this.graphData.dropNode(nodeKey);
    this.renderer?.refresh();
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

  /**
   * Exports the graph as a Graphology.SerializedGraph object.
   *
   * @param [excludeEdges] - whether the edges of the graph should be included or excluded
   *
   * @returns the graph as SerializedGraph object
   *
   * @public
   */
  public exportGraph(excludeEdges = false): SerializedGraph {
    if (excludeEdges) {
      this.graphData.clearEdges();
    } else {
      this.mergeEdgesIntoGraph();
    }

    return this.graphData.export();
  }

  /**---------------------------------------------------------------------------
   * Internal methods.
   *--------------------------------------------------------------------------*/

  /**
   * Injects settings into the [this.renderSettings] variable.
   *
   * @internal
   */
  private modifyRenderSettings(): void {
    // override the hover renderer
    this.renderSettings.hoverRenderer = (
      context: CanvasRenderingContext2D,
      data: PartialButFor<
        NodeAttributes,
        "x" | "y" | "size" | "label" | "color"
      >,
      settings: WebGLSettings
    ) => {
      if (!this.graphData.hasNode(data.key)) return;

      const hoverCallbacks: Record<number, IHoverCallback> = <
        Record<number, IHoverCallback>
      >this.configuration.getConfig("hoverCallbacks");

      if (hoverCallbacks) {
        // retrieve node type, if none was given use 0
        const nodeType = this.graphData.getNodeAttribute(data.key, "type");
        const type = nodeType ? nodeType : 0;

        // retrieve nodes hover callback
        const hoverCallback = hoverCallbacks[type];

        hoverCallback?.callback(data.key);
      }

      drawHover(context, data, settings);
    };

    // create reducers for highlighting sub graphs on hover if turned on
    if (<boolean>this.configuration.getConfig("highlightSubGraphOnHover")) {
      const hcolor = <string>(
        this.configuration.getConfig("subGraphHighlightColor")
      );

      const nodeReducer = (node: NodeKey, data: NodeAttributes) => {
        if (this.highlightedNodes.has(node)) {
          return { ...data, color: hcolor, zIndex: 1 };
        }

        return data;
      };

      const edgeReducer = (edge: EdgeKey, data: EdgeAttributes) => {
        if (this.highlightedEdges.has(edge)) {
          return { ...data, color: hcolor, zIndex: 1 };
        }

        return data;
      };

      this.renderSettings.nodeReducer = nodeReducer;
      this.renderSettings.edgeReducer = edgeReducer;
      this.renderSettings.zIndex = true;
    }

    // apply custom node program
    this.renderSettings.nodeProgramClasses = {
      circle: CustomNodeProgram,
    };
  }

  /**
   * Merges edges into the graph.
   *
   * @internal
   */
  private mergeEdgesIntoGraph(): void {
    if (this.edges.length <= 0) return;

    this.edges.forEach((edge) => {
      const key: EdgeKey | undefined = edge.key;

      if (key) {
        this.graphData.addEdgeWithKey(
          key,
          edge.source,
          edge.target,
          edge.attributes
        );
      } else {
        this.graphData.addEdge(edge.source, edge.target, edge.attributes);
      }
    });

    this.edges = [];
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
   * @throws Error - If the selected layout and pre applied layout are both {@link Layout.FORCEATLAS2}
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
    // context menu listeners
    this.initializeContextMenuListeners();

    // drag listeners
    this.initializeDragListeners();

    // hover highlight listeners
    this.initializeHoverHighlightingListeners();
  }

  /**
   * Initializes the context menu listeners. Loads all context menus as well as the
   * "suppressContextMenu" value from the {@link ILayoutConfiguration} and initializes
   * the listeners. When no {@link IContextMenu} is available, there will be no context
   * menu on a right click on a node.
   *
   * @remarks - Regarding {@link IContextMenu}:
   * The number given for a context menu represents the type the context
   * menu belongs to:
   * A node with type 0 would get the {@link IContextMenu} mapped to 0
   * A node with type 1 would get the {@link IContextMenu} mapped to 1
   * ...
   *
   * @internal
   */
  private initializeContextMenuListeners(): void {
    if (!this.renderer) return;

    const cmelement = document.getElementById("webGraphCM");
    let contextMenuOpen = false;

    this.renderer.on("rightClickNode", ({ node, event }) => {
      if (event.original.type !== "contextmenu") return;
      if (!cmelement) return;

      if (contextMenuOpen) {
        // hide the context menu that's open
        cmelement.className = "hide";
        contextMenuOpen = false;
      }

      event.preventDefault();

      // load context menus from the active configuration
      const allContextMenus = <Record<number, IContextMenu>>(
        this.configuration.getConfig("contextMenus")
      );
      if (!allContextMenus) return;

      // retrieve node type, if none was given use 0
      const nodeType = this.graphData.getNodeAttribute(node, "type");
      const type = nodeType ? nodeType : 0;

      // retrieve nodes corresponding context menu
      const contextMenu = allContextMenus[type];
      if (!contextMenu) return;

      // generate context menus content
      const contextMenuContent = document.createElement("ol");
      contextMenu.entries.forEach((ci) => {
        const item: HTMLElement = document.createElement("li");

        item.innerHTML = ci.label;

        item.addEventListener("click", () => {
          ci.callback(node);

          // hide the context menu that's open
          cmelement.className = "hide";
          contextMenuOpen = false;
        });

        contextMenuContent.append(item);
      });

      // display the context menu
      cmelement.innerHTML = "";
      cmelement.append(contextMenuContent);
      cmelement.className = "show";
      cmelement.style.top = event.y + "px";
      cmelement.style.left = event.x + "px";
      contextMenuOpen = true;
    });

    this.container.addEventListener("click", () => {
      if (!contextMenuOpen) return;
      if (!cmelement) return;

      // hide the context menu if open
      cmelement.className = "hide";
      contextMenuOpen = false;
    });

    // handles whether the default context menu is suppressed or not
    this.container.addEventListener("contextmenu", (event) => {
      const suppressContextMenu = <boolean>(
        this.configuration.getConfig("suppressContextMenu")
      );

      if (!suppressContextMenu) return;

      event.preventDefault();
    });
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

  /**
   * Initializes listeners to highlight a nodes sub graph on hover.
   * This can be turned on or off using the 'highlightSubGraphOnHover'
   * setting in the configuration, which is true by default.
   *
   * @internal
   */
  private initializeHoverHighlightingListeners(): void {
    if (!this.renderer) return;
    if (!(<boolean>this.configuration.getConfig("highlightSubGraphOnHover")))
      return;

    this.renderer.on("enterNode", ({ node }) => {
      // add nodes
      this.highlightedNodes = new Set(this.graphData.neighbors(node));
      this.highlightedNodes.add(node);

      // add edges
      this.highlightedEdges = new Set(this.graphData.edges(node));

      this.renderer?.refresh();
    });

    this.renderer.on("leaveNode", ({ node }) => {
      // reset the zIndex
      if (this.graphData.hasNode(node)) {
        // check that hovered node is still part of the graph
        this.graphData.setNodeAttribute(node, "zIndex", 0);
      }
      this.highlightedNodes.forEach((node) => {
        this.graphData.setNodeAttribute(node, "zIndex", 0);
      });
      this.highlightedEdges.forEach((edge) => {
        this.graphData.setEdgeAttribute(edge, "zIndex", 0);
      });

      // clear the lists
      this.highlightedNodes.clear();
      this.highlightedEdges.clear();

      this.renderer?.refresh();
    });
  }
}

export { WebGraph };
