import Graph from "graphology";
import {
  SerializedGraph,
  SerializedNode,
  SerializedEdge,
  EdgeKey,
  NodeKey,
} from "graphology-types";
import { circular, circlepack, random } from "graphology-layout";
import randomLayout, { RandomLayoutOptions } from "graphology-layout/random";
import circularLayout, {
  CircularLayoutOptions,
} from "graphology-layout/circular";
import circlePackLayout, {
  CirclePackLayoutOptions,
} from "graphology-layout/circlepack";
import forceatlas2Layout from "graphology-layout-forceatlas2";
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
  NodeType,
} from "../Configuration";
import drawHover from "./Canvas/hover";
import {
  NodeRingProgram,
  NodeCircleProgram,
  NodeRectangleProgram,
  NodeTriangleProgram,
} from "./Program";
import { animateNodes } from "sigma/src/animate";
import { cubicInOut } from "sigma/src/easings";
import { ActionType, HistoryManager } from "./History";
import drawLabel from "./Canvas/label";
import { InternalUtils } from "../Utils";

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
  private highlightedNodes: Set<NodeKey> = new Set<NodeKey>();
  private highlightedEdges: Set<EdgeKey> = new Set<EdgeKey>();
  private hoveredNode: NodeKey | undefined = undefined;
  private isHoverContainerVisible = false;
  private isNodeDragged = false;
  private isHistoryEnabled = false;
  private history: HistoryManager | undefined = undefined;

  /**
   * Creates an instance of web graph.
   *
   * @param container - The container where to hook the graph into
   * @param graphData - The graph to be rendered
   * @param [graphConfiguration] - Configurations to be applied. @see {@link IGraphConfiguration} for all available configs. @defaultValue `{}`
   * @param [renderSettings] - Render settings to be applied and directly passed to the sigma.js WebGLRenderer. @see {@link https://github.com/jacomyal/sigma.js/blob/v2/src/renderers/webgl/settings.ts} for all available configs. @defaultValue `{}`
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
    const oldAppMode = this.appMode;

    this.configuration.setConfig("appMode", appMode);

    if (this.isHistoryEnabled) {
      this.history?.addAction(
        {
          appMode: oldAppMode,
        },
        ActionType.UPDATE_APP_MODE,
        {
          appMode: appMode,
        }
      );
    }
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
      <ILayoutConfiguration>this.configuration.getConfig("layoutConfiguration"),
      true
    );

    this.overwriteRenderSettings();

    this.renderer = new WebGLRenderer(
      this.graphData,
      this.container,
      this.renderSettings
    );

    this.initializeEventHandlers();

    this.isHistoryEnabled = <boolean>(
      this.configuration.getConfig("enableHistory")
    );

    if (this.isHistoryEnabled) this.history = new HistoryManager();
  }

  /**
   * Merges edges into the graph.
   *
   * @param edges - A Set of SerializedEdge to merge into the graph
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public mergeEdges(edges: Set<SerializedEdge>, addToHistory = true): void {
    if (edges.size <= 0) return;

    const existingEdges = new Set<SerializedEdge>();

    edges.forEach((edge) => {
      const key: EdgeKey | undefined = edge.key;

      if (
        this.isHistoryEnabled &&
        addToHistory &&
        this.graphData.hasEdge(edge.source, edge.target)
      ) {
        existingEdges.add({
          key: key,
          attributes: key
            ? Object.assign({}, this.graphData.getEdgeAttributes(key))
            : undefined,
          source: edge.source,
          target: edge.target,
        });
      }

      if (key) {
        this.graphData.mergeEdgeWithKey(
          key,
          edge.source,
          edge.target,
          edge.attributes
        );
      } else {
        this.graphData.mergeEdge(edge.source, edge.target, edge.attributes);
      }
    });

    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        {
          edges: existingEdges,
        },
        ActionType.UPDATE_OR_ADD_EDGE,
        {
          edges: edges,
        }
      );
    }
  }

  /**
   * Removes all existing edges and replaces them with the given array
   * of edges.
   *
   * @param edges - An array holding the new Graphology.SerializedEdge (s)
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public replaceEdges(edges: Set<SerializedEdge>, addToHistory = true): void {
    if (this.isHistoryEnabled && addToHistory) {
      const existingEdges = new Set<SerializedEdge>();

      this.graphData.forEachEdge((edge) =>
        existingEdges.add({
          key: edge,
          attributes: this.graphData.getEdgeAttributes(edge),
          source: this.graphData.source(edge),
          target: this.graphData.target(edge),
        })
      );

      this.history?.addAction(
        {
          edges: existingEdges,
        },
        ActionType.REPLACE_EDGES,
        {
          edges: edges,
        }
      );
    }

    this.graphData.clearEdges();
    this.mergeEdges(edges, false);
  }

  /**
   * Changes whether edges are rendered or not.
   *
   * @param hideEdges - if true: hides edges, if false: renders edges
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public toggleEdgeRendering(hideEdges: boolean, addToHistory = true): void {
    const oldValue = this.renderer?.toggleEdgeRendering(hideEdges);

    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        {
          toggleEdgeRendering: oldValue,
        },
        ActionType.TOGGLE_EDGE_RENDERING,
        {
          toggleEdgeRendering: hideEdges,
        }
      );
    }
  }

  /**
   * Changes whether just edges are rendered or all.
   *
   * @param renderJustImportant - if true: render just important edges, if false: renders all edges
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public toggleJustImportantEdgeRendering(
    renderJustImportant: boolean,
    addToHistory = true
  ): void {
    const oldValue = this.renderer?.renderJustImportantEdges(
      renderJustImportant
    );

    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        {
          toggleEdgeRendering: oldValue,
        },
        ActionType.TOGGLE_IMPORTANT_EDGE_RENDERING,
        {
          toggleEdgeRendering: renderJustImportant,
        }
      );
    }
  }

  /**
   * Adds a node if not present already. If the node exists already,
   * the attributes of the existing and the new node will be merged.
   *
   * @param nodes - An array holding all SerializedNodes to merge into the graph
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public mergeNodes(nodes: Array<SerializedNode>, addToHistory = true): void {
    if (nodes.length <= 0) return;

    const existingNodes = new Array<SerializedNode>();

    nodes.forEach((node) => {
      if (
        this.isHistoryEnabled &&
        addToHistory &&
        this.graphData.hasNode(node.key)
      ) {
        existingNodes.push({
          key: node.key,
          attributes: Object.assign(
            {},
            this.graphData.getNodeAttributes(node.key)
          ),
        });
      }

      this.graphData.mergeNode(node.key, node.attributes);
    });

    this.renderer?.process();
    this.renderer?.refresh();

    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        {
          nodes: existingNodes,
        },
        ActionType.UPDATE_OR_ADD_NODE,
        {
          nodes: nodes,
        }
      );
    }
  }

  /**
   * Sets and applies the requested layout to the graph.
   *
   * @param layout - The {@link Layout} to be set and applied
   * @param layoutConfiguration - The {@link ILayoutConfiguration} of the layout
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public setAndApplyLayout(
    layout: Layout,
    layoutConfiguration: ILayoutConfiguration,
    addToHistory = true
  ): void {
    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        {
          layout: <Layout>this.configuration.getConfig("layout"),
          layoutConfig: <ILayoutConfiguration>(
            this.configuration.getConfig("layoutConfiguration")
          ),
        },
        ActionType.SET_LAYOUT,
        {
          layout: layout,
          layoutConfig: layoutConfiguration,
        }
      );
    }

    this.configuration.setConfig("layout", layout);
    this.configuration.setConfig("layoutConfiguration", layoutConfiguration);

    this.applyLayout(layout, layoutConfiguration, false);
  }

  /**
   * Sets and applies the requested nodeType as default node type.
   *
   * @param nodeType - The {@link NodeType} to be set and applied
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public setAndApplyNodeType(nodeType: NodeType, addToHistory = true): void {
    if (!this.renderer) return;

    const oldNodeType = <NodeType>(
      this.configuration.getConfig("defaultNodeType")
    );
    this.configuration.setConfig("defaultNodeType", nodeType);
    this.renderSettings.defaultNodeType = nodeType;
    this.renderer.settings.defaultNodeType = nodeType;

    this.renderer.process();
    this.renderer.refresh();

    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        { nodeType: oldNodeType },
        ActionType.UPDATE_NODE_TYPE,
        { nodeType: nodeType }
      );
    }
  }

  /**
   * Drops a node from the graph.
   *
   * @param nodeKey - The key of the node to drop
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @returns true if the operation was successfull, false if not
   *
   * @public
   */
  public dropNode(nodeKey: string, addToHistory = true): boolean {
    if (!this.graphData.hasNode(nodeKey)) return false;

    // remove node from highlightedNodes set
    if (this.highlightedNodes.has(nodeKey))
      this.highlightedNodes.delete(nodeKey);

    // remove all to the node connected edges that are currently being highlighted
    // from the highlightedEdges set
    const edges = this.graphData.edges(nodeKey);
    const edgeSetForHistory: Set<SerializedEdge> = new Set<SerializedEdge>();
    edges.forEach((edge) => {
      if (this.highlightedEdges.has(edge)) {
        this.highlightedEdges.delete(edge);
      }

      if (this.isHistoryEnabled && addToHistory) {
        edgeSetForHistory.add({
          key: edge,
          source: this.graphData.source(edge),
          target: this.graphData.target(edge),
          attributes: this.graphData.getEdgeAttributes(edge),
        });
      }
    });

    // hide the hover container
    this.hideHoverContainer();

    // add to history
    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        {
          nodes: [
            {
              key: nodeKey,
              attributes: this.graphData.getNodeAttributes(nodeKey),
            },
          ],
          edges: edgeSetForHistory,
        },
        ActionType.DROP_NODE,
        {}
      );
    }

    // drop the node and refresh
    this.graphData.dropNode(nodeKey);
    this.renderer?.refresh();
    return true;
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
   * @param [excludeEdges] - whether the edges of the graph should be included (false) or excluded (true), @defaultValue `false`
   *
   * @returns the graph as SerializedGraph object
   *
   * @public
   */
  public exportGraph(excludeEdges = false): SerializedGraph {
    if (excludeEdges) {
      this.graphData.clearEdges();
    }

    return this.graphData.export();
  }

  /**
   * This method performs an undo operation on the latest action
   * of the history.
   *
   * @remarks - Regardting the {@link IGraphConfiguration}
   * The history feature is just available if it was enabled in the
   * {@link IGraphConfiguration} using the "enableHistory" boolean.
   *
   * @throws Error - If the History is disabled.
   *
   * @returns true if the operation was successfull, false if not
   *
   * @public
   */
  public undo(): boolean {
    if (!this.isHistoryEnabled) {
      throw new Error(
        "The history is not enabled. Use the 'enableHistory' boolean to enable it in the IGraphConfiguration."
      );
    }

    const latestAction = this.history?.getLatestAction();
    if (!latestAction) return false;

    switch (latestAction.actionType) {
      case ActionType.UPDATE_APP_MODE:
        if (!latestAction.oldData.appMode) return false;
        this.configuration.setConfig("appMode", latestAction.oldData.appMode);
        break;

      case ActionType.UPDATE_OR_ADD_NODE:
        if (!latestAction.oldData.nodes || !latestAction.newData.nodes) {
          return false;
        }
        latestAction.newData.nodes.forEach((node) =>
          this.dropNode(node.key, false)
        );
        this.mergeNodes(
          // https://stackoverflow.com/a/24273055 since Object.assign doesn't work...
          JSON.parse(JSON.stringify(latestAction.oldData.nodes)),
          false
        );
        break;

      case ActionType.DROP_NODE:
        if (!latestAction.oldData.nodes || !latestAction.oldData.edges) {
          return false;
        }
        this.mergeNodes(latestAction.oldData.nodes, false);
        this.mergeEdges(latestAction.oldData.edges, false);
        break;

      case ActionType.UPDATE_NODE_TYPE:
        if (!latestAction.oldData.nodeType) return false;
        this.setAndApplyNodeType(latestAction.oldData.nodeType, false);
        break;

      case ActionType.REPLACE_EDGES:
        if (!latestAction.oldData.edges) return false;
        this.replaceEdges(latestAction.oldData.edges, false);
        break;

      case ActionType.UPDATE_OR_ADD_EDGE:
        if (!latestAction.oldData.edges) {
          return false;
        }
        this.replaceEdges(
          JSON.parse(JSON.stringify(latestAction.oldData.edges)),
          false
        );
        break;

      case ActionType.TOGGLE_EDGE_RENDERING:
        if (latestAction.oldData.toggleEdgeRendering === undefined) {
          return false;
        }
        this.toggleEdgeRendering(
          latestAction.oldData.toggleEdgeRendering,
          false
        );
        break;

      case ActionType.TOGGLE_IMPORTANT_EDGE_RENDERING:
        if (latestAction.oldData.toggleEdgeRendering === undefined) {
          return false;
        }
        this.toggleJustImportantEdgeRendering(
          latestAction.oldData.toggleEdgeRendering,
          false
        );
        break;

      case ActionType.SET_LAYOUT:
        if (
          !latestAction.oldData.layout ||
          !latestAction.oldData.layoutConfig
        ) {
          return false;
        }
        this.setAndApplyLayout(
          latestAction.oldData.layout,
          latestAction.oldData.layoutConfig,
          false
        );
        break;
    }

    this.history?.markLatestActionAsReverted();
    return true;
  }

  /**
   * This method performs a redo operation on the latest reverted action
   * of the history.
   *
   * @remarks - Regardting the {@link IGraphConfiguration}
   * The history feature is just available if it was enabled in the
   * {@link IGraphConfiguration} using the "enableHistory" boolean.
   *
   * @throws Error - If the History is disabled.
   *
   * @returns true if the operation was successfull, false if not
   *
   * @public
   */
  public redo(): boolean {
    if (!this.isHistoryEnabled) {
      throw new Error(
        "The history is not enabled. Use the 'enableHistory' boolean to enable it in the IGraphConfiguration."
      );
    }

    const latestRevertedAction = this.history?.getLatestRevertedAction();
    if (!latestRevertedAction) return false;

    switch (latestRevertedAction?.actionType) {
      case ActionType.UPDATE_APP_MODE:
        if (!latestRevertedAction.newData.appMode) return false;
        this.configuration.setConfig(
          "appMode",
          latestRevertedAction.newData.appMode
        );
        break;

      case ActionType.UPDATE_OR_ADD_NODE:
        if (!latestRevertedAction.newData.nodes) return false;
        this.mergeNodes(latestRevertedAction.newData.nodes, false);
        break;

      case ActionType.DROP_NODE:
        if (!latestRevertedAction.oldData.nodes) return false;
        latestRevertedAction.oldData.nodes.forEach((node) =>
          this.dropNode(node.key, false)
        );
        break;

      case ActionType.UPDATE_NODE_TYPE:
        if (!latestRevertedAction.newData.nodeType) return false;
        this.setAndApplyNodeType(latestRevertedAction.newData.nodeType, false);
        break;

      case ActionType.REPLACE_EDGES:
        if (!latestRevertedAction.newData.edges) return false;
        this.replaceEdges(latestRevertedAction.newData.edges, false);
        break;

      case ActionType.UPDATE_OR_ADD_EDGE:
        if (!latestRevertedAction.newData.edges) return false;
        this.mergeEdges(latestRevertedAction.newData.edges, false);
        break;

      case ActionType.TOGGLE_EDGE_RENDERING:
        if (latestRevertedAction.newData.toggleEdgeRendering === undefined) {
          return false;
        }
        this.toggleEdgeRendering(
          latestRevertedAction.newData.toggleEdgeRendering,
          false
        );
        break;

      case ActionType.TOGGLE_IMPORTANT_EDGE_RENDERING:
        if (latestRevertedAction.newData.toggleEdgeRendering === undefined) {
          return false;
        }
        this.toggleJustImportantEdgeRendering(
          latestRevertedAction.newData.toggleEdgeRendering,
          false
        );
        break;

      case ActionType.SET_LAYOUT:
        if (
          !latestRevertedAction.newData.layout ||
          !latestRevertedAction.newData.layoutConfig
        ) {
          return false;
        }
        this.setAndApplyLayout(
          latestRevertedAction.newData.layout,
          latestRevertedAction.newData.layoutConfig,
          false
        );
        break;
    }

    this.history?.markLatestRevertedActionAsNotReverted();
    return true;
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
   * @throws Error - If the selected layout and pre applied layout are both {@link Layout.FORCEATLAS2}
   *
   * @param layout - The {@link Layout} to apply to the graph
   * @param layoutConfig - The corresponding {@link ILayoutConfiguration} to the given layout
   * @param initialLayout - true: If this is the first layout to apply, apply random layout for incoming animation | false: nothing happens
   *
   * @internal
   */
  private applyLayout(
    layout: Layout,
    layoutConfig: ILayoutConfiguration,
    initialLayout: boolean
  ): void {
    if (initialLayout && layout !== Layout.PREDEFINED) {
      random.assign(this.graphData);
    }

    let newLayout;

    switch (layout) {
      case Layout.RANDOM:
        newLayout = randomLayout(
          this.graphData,
          layoutConfig.randomLayoutOptions
        );
        //random.assign(this.graphData, layoutConfig.randomLayoutOptions);
        break;

      case Layout.CIRCULAR:
        newLayout = circularLayout(
          this.graphData,
          layoutConfig.circularLayoutOptions
        );
        //circular.assign(this.graphData, layoutConfig.circularLayoutOptions);
        break;

      case Layout.CIRCLEPACK:
        newLayout = circlePackLayout(
          this.graphData,
          layoutConfig.circlePackLayoutOptions
        );
        //circlepack.assign(this.graphData, layoutConfig.circlePackLayoutOptions);
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

            const preAppliedLayoutOptions =
              forceAtlas2LayoutOptions.preAppliedLayoutOptions || {};

            switch (preAppliedLayout) {
              case Layout.RANDOM:
                random.assign(
                  this.graphData,
                  <RandomLayoutOptions>preAppliedLayoutOptions || {}
                );
                break;
              case Layout.CIRCULAR:
                circular.assign(
                  this.graphData,
                  <CircularLayoutOptions>preAppliedLayoutOptions || {}
                );
                break;
              case Layout.CIRCLEPACK:
                circlepack.assign(
                  this.graphData,
                  <CirclePackLayoutOptions>preAppliedLayoutOptions || {}
                );
                break;
            }
          }

          newLayout = forceatlas2Layout(
            this.graphData,
            forceAtlas2LayoutOptions
          );
          break;
        }

        newLayout = forceatlas2Layout(
          this.graphData,
          DEFAULT_FORCEATLAS2_LAYOUT_OPTIONS
        );
        break;
      }

      case Layout.PREDEFINED:
        /** do nothing */
        break;

      default:
        random.assign(this.graphData);
        break;
    }

    if (!newLayout || layout === Layout.PREDEFINED) return;

    animateNodes(
      this.graphData,
      newLayout,
      { duration: 1000, easing: cubicInOut },
      () => {
        /** do nothing */
      }
    );
  }

  /**
   * Injects settings into the [this.renderSettings] variable.
   *
   * @internal
   */
  private overwriteRenderSettings(): void {
    // override the hover renderer
    this.overwriteHoverRenderer();

    // override the label renderer
    this.overwriteLabelRenderer();

    // create reducers for highlighting sub graphs on hover if turned on
    this.overwriteReducers();

    // apply custom node programs
    this.overwriteNodePrograms();
  }

  /**
   * Overwrites the hoverRenderer by adding support for custom hover callbacks.
   * If no {@link IHoverCallback} is present, the sigma.js default hoverRenderer
   * will be used. Otherwise a nodes corresponding {@link IHoverCallback} will be
   * executed and the resulting {@link IHoverContent} applied to the given container.
   *
   * @remarks - Regarding {@link IHoverCallback}:
   * The number given in the 'callback' field of a {@link IHoverCallback} represents
   * the nodes callback:
   * A node with category 0 would get the callback mapped to 0
   * A node with category 1 would get the callback mapped to 1
   * ...
   *
   * @internal
   */
  private overwriteHoverRenderer(): void {
    const hoverCallbacks: IHoverCallback = <IHoverCallback>(
      this.configuration.getConfig("hoverCallbacks")
    );

    const hoverContainer = hoverCallbacks?.container;

    this.renderSettings.hoverRenderer = (
      context: CanvasRenderingContext2D,
      data: PartialButFor<
        NodeAttributes,
        "x" | "y" | "size" | "label" | "color"
      >,
      settings: WebGLSettings
    ) => {
      if (!this.graphData.hasNode(data.key)) return;

      // set the type for the hover canvas to know which form to draw
      data.type = this.graphData.getNodeAttribute(data.key, "type");

      // if no hover callbacks are provided, use the sigma.js library default
      if (!hoverCallbacks || !hoverContainer) {
        drawHover(context, data, settings, this.configuration);
        return;
      }

      if (this.isNodeDragged) return;

      // retrieve node category, if none was given use 0
      const category =
        this.graphData.getNodeAttribute(data.key, "category") ?? 0;

      // retrieve nodes hover callback
      const hoverCallback = hoverCallbacks.callback[category];

      // retrieve score
      const nodeScore = this.graphData.getNodeAttribute(data.key, "score");

      // execute callback
      hoverCallback(data.key, nodeScore)
        .then((result) => {
          // reset hoverContainer
          hoverContainer.innerHTML = "";

          let preheader, header, content, footer;

          if (result.preheader) {
            preheader = document.createElement("span");
            preheader.setAttribute("id", "preheader");
            preheader.innerHTML = result.preheader;
            hoverContainer.append(preheader);
          }

          if (result.header) {
            header = document.createElement("span");
            header.setAttribute("id", "header");
            header.innerHTML = result.header;
            hoverContainer.append(header);
          }

          if (result.content) {
            content = document.createElement("span");
            content.setAttribute("id", "content");
            content.innerHTML = result.content;
            hoverContainer.append(content);
          }

          if (result.footer) {
            footer = document.createElement("span");
            footer.setAttribute("id", "footer");
            footer.innerHTML = result.footer.toString();
            hoverContainer.append(footer);
          }

          // get possible offsets
          const yoffset = hoverCallbacks.yoffset || 0;
          const xoffset = hoverCallbacks.xoffset || 0;

          // reposition the hover container and make it visible
          hoverContainer.style.top = data.y + yoffset + "px";
          hoverContainer.style.left = data.x + xoffset + "px";
          hoverContainer.className = hoverCallbacks.cssShow;
          this.isHoverContainerVisible = true;
        })
        .catch((e) => {
          console.error(e);

          hoverContainer.className = hoverCallbacks.cssHide;
          this.isHoverContainerVisible = false;

          // fallback to the default sigma.js label if unable to execute callback
          drawHover(context, data, settings, this.configuration);
        });
    };

    // when leaving the hover container, hide it
    hoverContainer?.addEventListener("mouseleave", () =>
      this.hideHoverContainer()
    );
  }

  /**
   * Overwrites the label renderer and the selector for which labels to render.
   *
   * @internal
   */
  private overwriteLabelRenderer(): void {
    this.renderSettings.labelRenderer = drawLabel;

    this.renderSettings.labelSelector = InternalUtils.labelSelector;
  }

  /**
   * Hides the hover container.
   *
   * @param [rightClickNode] - Whether a node has been right clicked to open the context menu
   *
   * @internal
   */
  private hideHoverContainer(rightClickNode?: boolean): void {
    if (!this.isHoverContainerVisible) return;
    // if right click on node, continue to hide the node
    // if not right clicked, but still hovering over the node, return
    if (!rightClickNode && this.hoveredNode) return;

    const hoverCallbacks: IHoverCallback = <IHoverCallback>(
      this.configuration.getConfig("hoverCallbacks")
    );

    if (!hoverCallbacks) return;

    hoverCallbacks.container.className = hoverCallbacks.cssHide;
    this.isHoverContainerVisible = false;
  }

  /**
   * Overwrites node and edge reducers for when "highlightSubGraphOnHover"
   * is true in the {@link IGraphConfiguration}.
   *
   * @internal
   */
  private overwriteReducers(): void {
    if (!(<boolean>this.configuration.getConfig("highlightSubGraphOnHover"))) {
      return;
    }

    const hcolor = <string>(
      this.configuration.getConfig("subGraphHighlightColor")
    );

    const nodeReducer = (node: NodeKey, data: NodeAttributes) => {
      if (this.highlightedNodes.has(node)) {
        return { ...data, color: hcolor, z: 1 };
      }

      return data;
    };

    const edgeReducer = (edge: EdgeKey, data: EdgeAttributes) => {
      if (this.highlightedEdges.has(edge)) {
        return { ...data, color: hcolor, z: 1 };
      }

      return data;
    };

    this.renderSettings.nodeReducer = nodeReducer;
    this.renderSettings.edgeReducer = edgeReducer;
    this.renderSettings.zIndex = true;
  }

  /**
   * Overwrites node programs.
   *
   * @internal
   */
  private overwriteNodePrograms(): void {
    this.renderSettings.defaultNodeType = <NodeType>(
      this.configuration.getConfig("defaultNodeType")
    );

    this.renderSettings.nodeProgramClasses = {
      ring: NodeRingProgram,
      circle: NodeCircleProgram,
      rectangle: NodeRectangleProgram,
      triangle: NodeTriangleProgram,
    };
  }

  /**
   * Initialize all available event handlers.
   *
   * @internal
   */
  private initializeEventHandlers(): void {
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
   * The number given in the 'entries' field of a {@link IContextMenu} represents the  node
   * category the array of {@link IContextMenuItem}s belongs to:
   * A node with category 0 would get the Array<IContextMenuItem> mapped to 0
   * A node with category 1 would get the Array<IContextMenuItem> mapped to 1
   * ...
   *
   * @internal
   */
  private initializeContextMenuListeners(): void {
    if (!this.renderer) return;

    // load context menus from the active configuration
    const allContextMenus = <IContextMenu>(
      this.configuration.getConfig("contextMenus")
    );
    if (!allContextMenus) return;

    const cmcontainer = allContextMenus.container;
    const cssHide = allContextMenus.cssHide;
    const cssShow = allContextMenus.cssShow;

    let isContextMenuOpen = false;

    this.renderer.on("rightClickNode", ({ node, event }) => {
      if (event.original.type !== "contextmenu") return;
      if (!cmcontainer) return;

      if (isContextMenuOpen) {
        // hide the context menu that's open
        cmcontainer.className = cssHide;
        isContextMenuOpen = false;
      }

      event.preventDefault();

      // retrieve node category, if none was given use 0
      const category = this.graphData.getNodeAttribute(node, "category") ?? 0;

      // retrieve nodes corresponding context menu
      const contextMenu = allContextMenus.entries[category];
      if (!contextMenu) return;

      // generate context menus content
      const contextMenuContent = document.createElement("ol");
      contextMenu.forEach((ci) => {
        const item: HTMLElement = document.createElement("li");

        item.innerHTML = ci.label;

        item.addEventListener("click", () => {
          ci.callback(node);

          // hide the context menu that's open
          cmcontainer.className = cssHide;
          isContextMenuOpen = false;
        });

        contextMenuContent.append(item);
      });

      // get possible offsets
      const yoffset = allContextMenus.yoffset || 0;
      const xoffset = allContextMenus.xoffset || 0;

      // display the context menu
      cmcontainer.innerHTML = "";
      cmcontainer.append(contextMenuContent);
      cmcontainer.className = cssShow;
      cmcontainer.style.top = event.y + yoffset + "px";
      cmcontainer.style.left = event.x + xoffset + "px";
      isContextMenuOpen = true;

      // hide the hover container
      this.hideHoverContainer(true);
    });

    this.container.addEventListener("click", () => {
      if (!isContextMenuOpen) return;
      if (!cmcontainer) return;

      // hide the context menu if open
      cmcontainer.className = cssHide;
      isContextMenuOpen = false;
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

    this.renderer.on("downNode", (event) => {
      if (this.appMode === AppMode.STATIC) return;

      this.isNodeDragged = true;
      draggedNode = event.node;
      camera.disable();
    });

    mouseCaptor.on("mouseup", () => {
      if (this.appMode === AppMode.STATIC) return;

      this.isNodeDragged = false;
      draggedNode = undefined;
      camera.enable();
    });

    mouseCaptor.on("mousemove", (e) => {
      if (
        !this.renderer ||
        this.appMode === AppMode.STATIC ||
        !this.isNodeDragged ||
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
   * @remarks - Regarding this.hideHoverContainer()
   * Since creating multiple events on "leaveNode" would overwrite existing ones
   * the hiding of the hover container has to be done here, where the enterNode
   * and leaveNode events are being created for the highlighting.
   *
   * @internal
   */
  private initializeHoverHighlightingListeners(): void {
    if (!this.renderer) return;
    if (!(<boolean>this.configuration.getConfig("highlightSubGraphOnHover"))) {
      // if highlighting the subgraph is disabled just add that the hover container
      // will be hidden when leaving a node
      this.renderer.on("leaveNode", () => {
        this.hideHoverContainer();
      });

      return;
    }

    this.renderer.on("enterNode", ({ node }) => {
      this.hoveredNode = node;

      // add nodes
      this.highlightedNodes = new Set(this.graphData.neighbors(node));
      this.highlightedNodes.add(node);

      // add edges
      this.highlightedEdges = new Set(this.graphData.edges(node));

      this.renderer?.refresh();
    });

    this.renderer.on("leaveNode", ({ node }) => {
      this.hoveredNode = undefined;

      // reset the zIndex
      if (this.graphData.hasNode(node)) {
        // check that hovered node is still part of the graph
        this.graphData.setNodeAttribute(node, "z", 0);
      }
      this.highlightedNodes.forEach((node) => {
        this.graphData.setNodeAttribute(node, "z", 0);
      });
      this.highlightedEdges.forEach((edge) => {
        this.graphData.setEdgeAttribute(edge, "z", 0);
      });

      // clear the lists
      this.highlightedNodes.clear();
      this.highlightedEdges.clear();

      this.renderer?.refresh();

      // if hoverContainerVisible is true, get the hover container and hide it
      this.hideHoverContainer();
    });
  }
}

export { WebGraph };
