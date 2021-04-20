import Graph from "graphology";
import {
  SerializedGraph,
  SerializedNode,
  SerializedEdge,
  EdgeKey,
  NodeKey,
  Attributes,
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
import { Camera, WebGLRenderer, animateNodes, easings } from "sigma";
import { PartialButFor } from "sigma/types/utils";
import { WebGLSettings } from "sigma/types/renderers/webgl/settings";
import { NodeAttributes, EdgeAttributes } from "sigma/types/types";
import { AppState } from "./appstate";
import {
  DEFAULT_GRAPH_CONFIGURATION,
  IGraphConfiguration,
  Layout,
  ILayoutConfiguration,
  DEFAULT_FORCEATLAS2_LAYOUT_OPTIONS,
  AppMode,
  NodeType,
  LabelSelector,
  INodeInfoBox,
} from "../Configuration";
import drawHover from "./Canvas/hover";
import {
  NodeRingProgram,
  NodeCircleProgram,
  NodeRectangleProgram,
  NodeTriangleProgram,
  NodeBackdropProgram,
} from "./WebGL";
import { ActionType, HistoryManager } from "./History";
import drawLabel from "./Canvas/label";
import { InternalUtils } from "../Utils";
import FA2Layout from "graphology-layout-forceatlas2/worker";

/**
 * The WebGraph class represents the main endpoint of the module.
 *
 * {@label WebGraph}
 */
class WebGraph {
  private container: HTMLElement;
  private graphData: Graph;
  private configuration: IGraphConfiguration;
  private appState: AppState = AppState.INACTIVE;
  private renderer: WebGLRenderer | undefined = undefined;
  private highlightedNodes: Set<NodeKey> = new Set<NodeKey>();
  private highlightedEdges: Set<EdgeKey> = new Set<EdgeKey>();
  private hoveredNode: NodeKey | undefined = undefined;
  private isNodeInfoBoxContainerVisible = false;
  private isNodeDragged = false;
  private isHistoryEnabled = false;
  private history: HistoryManager | undefined = undefined;
  private forceAtlas2WebWorker: FA2Layout | undefined = undefined;

  /**
   * Creates an instance of web graph.
   *
   * @param container - The container where to hook the graph into
   * @param graphData - The graph to be rendered
   * @param [graphConfiguration] - Configurations to be applied. @see {@link IGraphConfiguration} for all available configs. @defaultValue `{}`
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
   *    sigmaSettings: {
   *        renderEdgeLabels: true,
   *    }
   * }
   *
   * const webGraph = new WebGraph(container, graph, graphConfig);
   * ```
   */
  constructor(
    container: HTMLElement,
    graphData: Graph | SerializedGraph,
    graphConfiguration: Partial<IGraphConfiguration> = {}
  ) {
    this.container = container;

    if (graphData instanceof Graph) {
      this.graphData = graphData;
    } else {
      this.graphData = Graph.from(graphData);
    }

    this.configuration = {
      ...DEFAULT_GRAPH_CONFIGURATION,
      ...graphConfiguration,
    };
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
    return this.configuration.appMode;
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

    this.configuration.appMode = appMode;

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
      this.configuration.layout,
      this.configuration.layoutConfiguration,
      true,
      this.configuration.useForceAtlas2WebWorker !== undefined
    );

    this.overwriteRenderSettings();

    this.renderer = new WebGLRenderer(
      this.graphData,
      this.container,
      this.configuration.sigmaSettings
    );

    this.initializeEventHandlers();

    this.isHistoryEnabled = this.configuration.enableHistory;

    if (this.isHistoryEnabled) this.history = new HistoryManager();

    this.renderer.addListener("", (event) => console.log(event));
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

    if (!addToHistory) {
      nodes.forEach((node) => {
        this.graphData.forEachEdge(node.key, (edge) => {
          this.graphData.setEdgeAttribute(edge, "hidden", false);
        });
      });
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
      const oldLayout = this.configuration.layout;
      const layoutMapping: { [key: string]: { x: number; y: number } } = {};

      if (oldLayout === Layout.FORCEATLAS2 || layout === Layout.FORCEATLAS2) {
        this.graphData.nodes().forEach((node) => {
          const attr = this.graphData.getNodeAttributes(node);
          layoutMapping[node] = { x: attr.x, y: attr.y };
        });
      }

      this.history?.addAction(
        {
          layout: oldLayout,
          layoutConfig: this.configuration.layoutConfiguration,
          layoutMapping: layoutMapping,
        },
        ActionType.SET_LAYOUT,
        {
          layout: layout,
          layoutConfig: layoutConfiguration,
        }
      );
    }

    this.configuration.layout = layout;
    this.configuration.layoutConfiguration = layoutConfiguration;

    this.applyLayout(layout, layoutConfiguration, false, false);
  }

  /**
   * Applies the currently set layout again. Used for clustering algorithms.
   * If the currently active {@link Layout} is {@link FORCEATLAS2}, the
   * preAppliedLayout and preAppliedLayoutOptions will be overwritten
   * with undefined.
   *
   * @public
   */
  public reapplyLayout(): void {
    if (
      this.configuration.layout === Layout.FORCEATLAS2 &&
      this.configuration.layoutConfiguration.forceAtlas2LayoutOptions
    ) {
      this.configuration.layoutConfiguration.forceAtlas2LayoutOptions.preAppliedLayout = undefined;
      this.configuration.layoutConfiguration.forceAtlas2LayoutOptions.preAppliedLayoutOptions = undefined;
    }

    this.applyLayout(
      this.configuration.layout,
      this.configuration.layoutConfiguration,
      false,
      false
    );
  }

  /**
   * Sets and applies the requested nodeType as default node type.
   *
   * @param nodeType - The {@link NodeType} to be set and applied
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @public
   */
  public setAndApplyDefaultNodeType(
    nodeType: NodeType,
    addToHistory = true
  ): void {
    if (!this.renderer) return;

    const oldNodeType = this.configuration.defaultNodeType;
    this.configuration.defaultNodeType = nodeType;
    this.configuration.sigmaSettings.defaultNodeType = nodeType;
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
   * Drops nodes from the graph.
   *
   * @param nodes - The keys of the nodes (or the whole node) to drop in an array
   * @param [addToHistory] - True by default. Whether the action should be added to the history or not. @defaultValue `true`
   *
   * @returns true if the operation was successful, false if not
   *
   * @public
   */
  public dropNodes(
    nodes: Array<NodeKey | SerializedNode>,
    addToHistory = true
  ): void {
    const edgeSetForHistory: Set<SerializedEdge> = new Set<SerializedEdge>();
    const nodeArrayForHistory: Array<SerializedNode> = new Array<SerializedNode>();

    nodes.forEach((node) => {
      const key: string =
        typeof node === "number" || typeof node === "string"
          ? node.toString()
          : (<SerializedNode>node).key.toString();

      if (!this.graphData.hasNode(key)) return;

      // remove node from highlightedNodes set
      if (this.highlightedNodes.has(key)) this.highlightedNodes.delete(key);

      // remove all to the node connected edges that are currently being highlighted
      // from the highlightedEdges set
      const edges = this.graphData.edges(key);
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

      // hide the node info box container
      this.hideNodeInfoBoxContainer();

      // add to history set
      if (this.isHistoryEnabled && addToHistory) {
        nodeArrayForHistory.push({
          key: node.toString(),
          attributes: this.graphData.getNodeAttributes(key),
        });
      }

      // drop the node
      this.graphData.dropNode(key);
    });

    // add to history
    if (this.isHistoryEnabled && addToHistory) {
      this.history?.addAction(
        {
          nodes: nodeArrayForHistory,
          edges: edgeSetForHistory,
        },
        ActionType.DROP_NODE,
        {}
      );
    }

    // refresh
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
    this.forceAtlas2WebWorker?.kill();
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
   * @remarks - Regarding the {@link IGraphConfiguration}
   * The history feature is just available if it was enabled in the
   * {@link IGraphConfiguration} using the "enableHistory" boolean.
   *
   * @throws Error - If the History is disabled.
   *
   * @returns true if the operation was successful, false if not
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
        this.configuration.appMode = latestAction.oldData.appMode;
        break;

      case ActionType.UPDATE_OR_ADD_NODE:
        if (!latestAction.oldData.nodes || !latestAction.newData.nodes) {
          return false;
        }
        this.dropNodes(latestAction.newData.nodes, false);

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
        this.setAndApplyDefaultNodeType(latestAction.oldData.nodeType, false);
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
          !latestAction.oldData.layoutConfig ||
          !latestAction.oldData.layoutMapping
        ) {
          return false;
        }

        if (latestAction.oldData.layout === Layout.FORCEATLAS2) {
          this.animateGraph(this.graphData, latestAction.oldData.layoutMapping);
          break;
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
   * @remarks - Regarding the {@link IGraphConfiguration}
   * The history feature is just available if it was enabled in the
   * {@link IGraphConfiguration} using the "enableHistory" boolean.
   *
   * @throws Error - If the History is disabled.
   *
   * @returns true if the operation was successful, false if not
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
        this.configuration.appMode = latestRevertedAction.newData.appMode;
        break;

      case ActionType.UPDATE_OR_ADD_NODE:
        if (!latestRevertedAction.newData.nodes) return false;
        this.mergeNodes(latestRevertedAction.newData.nodes, false);
        break;

      case ActionType.DROP_NODE:
        if (!latestRevertedAction.oldData.nodes) return false;
        this.dropNodes(latestRevertedAction.oldData.nodes, false);
        break;

      case ActionType.UPDATE_NODE_TYPE:
        if (!latestRevertedAction.newData.nodeType) return false;
        this.setAndApplyDefaultNodeType(
          latestRevertedAction.newData.nodeType,
          false
        );
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

  /**
   * Gets the camera. All interactions with the camera are not tracked by the history.
   *
   * @throws Error - If the renderer is not defined.
   *
   * @returns - The camera object of the renderer.
   */
  public get camera(): Camera {
    if (!this.renderer || !this.isRenderingActive) {
      throw new Error("Can't retrieve camera when rendering is inactive.");
    }

    return this.renderer.getCamera();
  }

  /**
   * Gets the ForceAtlas2 web worker. Please be aware that all interactions with the web worker
   * are not tracked by the history.
   *
   * @throws Error - If the renderer is not defined or the 'useForceAtlas2WebWorker' is not enabled
   *
   * @returns - The ForceAtlas2 Web Worker object or undefined if not used
   */
  public get ForceAtlas2WebWorker(): FA2Layout | undefined {
    if (!this.renderer || !this.isRenderingActive) {
      throw new Error(
        "Can't retrieve ForceAtlas2 web worker when rendering is inactive."
      );
    }

    if (!this.configuration.useForceAtlas2WebWorker) {
      throw new Error(
        "ForceAtlas2 web worker was not enabled. Use the 'useForceAtlas2WebWorker' configuration to enable it."
      );
    }

    return this.forceAtlas2WebWorker;
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
   * @param useWorker - Whether to use the ForceAtlas2 worker or not
   *
   * @internal
   */
  private applyLayout(
    layout: Layout,
    layoutConfig: ILayoutConfiguration,
    initialLayout: boolean,
    useWorker: boolean
  ): void {
    if (initialLayout && layout !== Layout.PREDEFINED) {
      random.assign(this.graphData);
    }

    if (
      useWorker &&
      layout === Layout.FORCEATLAS2 &&
      this.configuration.useForceAtlas2WebWorker
    ) {
      // this will overwrite the setImmediate which is not supported widely but used in the graphology library
      // to work in almost every environment
      // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate
      // see also: https://stackoverflow.com/questions/52164025/onsenui-uncaught-referenceerror-setimmediate-is-not-defined
      (window.setImmediate as any) = window.setTimeout; // eslint-disable-line @typescript-eslint/no-explicit-any

      const forceAtlas2LayoutOptions = layoutConfig.forceAtlas2LayoutOptions;

      this.forceAtlas2WebWorker = new FA2Layout(this.graphData, {
        settings: forceAtlas2LayoutOptions?.settings,
      });

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
            forceAtlas2LayoutOptions.preAppliedLayoutOptions || {},
            initialLayout,
            false
          );
        }
      }

      this.forceAtlas2WebWorker.start();

      setTimeout(() => {
        this.forceAtlas2WebWorker?.stop();
      }, this.configuration.useForceAtlas2WebWorker);
      return;
    }

    let newLayout;

    switch (layout) {
      case Layout.RANDOM:
        newLayout = randomLayout(
          this.graphData,
          layoutConfig.randomLayoutOptions
        );
        break;

      case Layout.CIRCULAR:
        newLayout = circularLayout(
          this.graphData,
          layoutConfig.circularLayoutOptions
        );
        break;

      case Layout.CIRCLEPACK:
        newLayout = circlePackLayout(
          this.graphData,
          layoutConfig.circlePackLayoutOptions
        );
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

    this.animateGraph(this.graphData, newLayout);
  }

  /**
   * Animates the graph to the given mappings.
   *
   * @param graph - The graph to animate
   * @param mapping - The mappings to apply to the graph
   *
   * @internal
   */
  private animateGraph(
    graph: Graph,
    mapping: { [key: string]: { x: number; y: number } }
  ): void {
    animateNodes(
      graph,
      mapping,
      { duration: 1000, easing: easings["cubicInOut"] },
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

    // create reducers for highlighting sub graphs on hover if enabled
    this.overwriteReducers();

    // apply custom node programs
    this.overwriteNodePrograms();
  }

  /**
   * Overwrites the hoverRenderer by adding support for custom node info boxes.
   * If no {@link INodeInfoBox} is provided, the sigma.js default hoverRenderer
   * will be used. Otherwise a nodes corresponding {@link INodeInfoBox} will be
   * executed and the resulting {@link INodeInfoBox} applied to the given container.
   * There's nothing like a default value for the category attribute, if it is not
   * present. If the category attribute is missing, the node will not have a hover.
   *
   * If the 'showNodeInfoBoxOnClick' configuration is set to true, the sigma.js
   * default hoverRenderer will be used and the node info box will be visible on
   * a click on a node.
   *
   * @remarks - Regarding {@link INodeInfoBox}:
   * The number given in the 'callback' field of a {@link INodeInfoBox} represents
   * the nodes callback:
   * A node with category 0 would get the callback mapped to 0
   * A node with category 1 would get the callback mapped to 1
   * ...
   *
   * @internal
   */
  private overwriteHoverRenderer(): void {
    // if 'disableHover' is set to true, overwrite the hoverRenderer with an empty function
    if (this.configuration.disableHover) {
      this.configuration.sigmaSettings.hoverRenderer = (_) => _;
      return;
    }

    const nodeInfoBox = this.configuration.nodeInfoBox;
    const nodeInfoBoxContainer = nodeInfoBox?.container;

    this.configuration.sigmaSettings.hoverRenderer = (
      context: CanvasRenderingContext2D,
      data: PartialButFor<
        NodeAttributes,
        "x" | "y" | "size" | "label" | "color"
      >,
      settings: WebGLSettings
    ) => {
      if (!this.graphData.hasNode(data.key)) return;

      const nodeAttributes = this.graphData.getNodeAttributes(data.key);

      // set the type for the hover canvas to know which form to draw
      data.type = nodeAttributes.type;

      // if no node info callbacks are provided, use the sigma.js library default
      // or if nodeInfoBox should appear on click and not on hover
      if (
        !nodeInfoBox ||
        !nodeInfoBoxContainer ||
        this.configuration.showNodeInfoBoxOnClick
      ) {
        drawHover(context, data, settings, this.configuration);
        return;
      }

      if (this.isNodeDragged) return;

      // set the score and category attribute
      data.score = nodeAttributes.score;
      data.category = nodeAttributes.category;

      this.generateNodeInfoBox(
        nodeInfoBox,
        nodeInfoBoxContainer,
        data,
        context,
        settings
      );
    };

    // when leaving the hover container, hide it
    nodeInfoBoxContainer?.addEventListener("mouseleave", () =>
      this.hideNodeInfoBoxContainer()
    );
  }

  private generateNodeInfoBox(
    nodeInfoBox: INodeInfoBox,
    nodeInfoBoxContainer: HTMLElement,
    data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "label" | "color">,
    context?: CanvasRenderingContext2D,
    settings?: WebGLSettings
  ): void {
    // if no category is present, return
    if (data.category === undefined) return;

    // retrieve nodes info callback
    const nodeInfoCallback = nodeInfoBox.callback[data.category];

    // execute callback
    nodeInfoCallback(data.key, data.score)
      .then((result) => {
        // reset node info box
        nodeInfoBoxContainer.innerHTML = "";

        let preHeader, header, content, footer;

        if (result.preheader) {
          preHeader = document.createElement("span");
          preHeader.setAttribute("id", "preheader");
          preHeader.innerHTML = result.preheader;
          nodeInfoBoxContainer.append(preHeader);
        }

        if (result.header) {
          header = document.createElement("span");
          header.setAttribute("id", "header");
          header.innerHTML = result.header;
          nodeInfoBoxContainer.append(header);
        }

        if (result.content) {
          content = document.createElement("span");
          content.setAttribute("id", "content");
          content.innerHTML = result.content;
          nodeInfoBoxContainer.append(content);
        }

        if (result.footer) {
          footer = document.createElement("span");
          footer.setAttribute("id", "footer");
          footer.innerHTML = result.footer.toString();
          nodeInfoBoxContainer.append(footer);
        }

        // get possible offsets
        const yoffset = nodeInfoBox.yoffset || 0;
        const xoffset = nodeInfoBox.xoffset || 0;

        // reposition the hover container and make it visible
        nodeInfoBoxContainer.style.top = data.y + yoffset + "px";
        nodeInfoBoxContainer.style.left = data.x + xoffset + "px";
        nodeInfoBoxContainer.className = nodeInfoBox.cssShow;
        this.isNodeInfoBoxContainerVisible = true;
      })
      .catch((e) => {
        console.error(e);

        nodeInfoBoxContainer.className = nodeInfoBox.cssHide;
        this.isNodeInfoBoxContainerVisible = false;

        if (!context || !settings) return;

        // fallback to the default sigma.js label if unable to execute callback
        drawHover(context, data, settings, this.configuration);
      });
  }

  /**
   * Hides the node info box container.
   *
   * @param [rightClickNode] - Whether a node has been right clicked to open the context menu
   *
   * @internal
   */
  private hideNodeInfoBoxContainer(rightClickNode?: boolean): void {
    if (!this.isNodeInfoBoxContainerVisible) return;
    // if right click on node, continue to hide the node
    // if not right clicked, but still hovering over the node, return
    if (!rightClickNode && this.hoveredNode) return;

    const nodeInfoBox = this.configuration.nodeInfoBox;

    if (!nodeInfoBox) return;

    nodeInfoBox.container.className = nodeInfoBox.cssHide;
    this.isNodeInfoBoxContainerVisible = false;
  }

  /**
   * Overwrites the label renderer and the selector for which labels to render.
   *
   * @internal
   */
  private overwriteLabelRenderer(): void {
    this.configuration.sigmaSettings.labelRenderer = drawLabel;

    switch (this.configuration.labelSelector) {
      case LabelSelector.ALL:
        this.configuration.sigmaSettings.labelSelector =
          InternalUtils.labelSelectorAll;
        break;
      case LabelSelector.LEVELS:
        this.configuration.sigmaSettings.labelSelector =
          InternalUtils.labelSelectorLevels;
        break;
      case LabelSelector.IMPORTANT:
        this.configuration.sigmaSettings.labelSelector =
          InternalUtils.labelSelectorImportant;
        break;
      case LabelSelector.SIGMA:
      default:
        // do nothing, default in the settings is sigma
        break;
    }
  }

  /**
   * Overwrites node and edge reducers for when "highlightSubGraphOnHover"
   * is true in the {@link IGraphConfiguration}.
   *
   * @internal
   */
  private overwriteReducers(): void {
    if (!this.configuration.highlightSubGraphOnHover) return;

    const highlightColor = this.configuration.subGraphHighlightColor;
    const neighborsNeighborsColor = this.configuration.importantNeighborsColor;

    const nodeReducer = (node: NodeKey, data: NodeAttributes) => {
      if (this.highlightedNodes.has(node)) {
        // if neighbor of neighbor and different color is set
        if (
          neighborsNeighborsColor &&
          this.hoveredNode &&
          this.hoveredNode !== node &&
          this.graphData.hasNode(this.hoveredNode) &&
          this.graphData.hasNode(node) &&
          !this.graphData.neighbors(this.hoveredNode, node)
        ) {
          return { ...data, color: neighborsNeighborsColor, z: 1 };
        }

        // default
        return { ...data, color: highlightColor, z: 1 };
      }

      return data;
    };

    const edgeReducer = (edge: EdgeKey, data: EdgeAttributes) => {
      if (this.highlightedEdges.has(edge)) {
        // if neighbor of neighbor and different color is set
        if (
          neighborsNeighborsColor &&
          this.hoveredNode &&
          this.graphData.source(edge) !== this.hoveredNode &&
          this.graphData.target(edge) !== this.hoveredNode
        ) {
          return { ...data, color: neighborsNeighborsColor, z: 1 };
        }

        // default
        return { ...data, color: highlightColor, z: 1 };
      }

      return data;
    };

    this.configuration.sigmaSettings.nodeReducer = nodeReducer;
    this.configuration.sigmaSettings.edgeReducer = edgeReducer;
    this.configuration.sigmaSettings.zIndex = true;
  }

  /**
   * Overwrites node programs.
   *
   * @internal
   */
  private overwriteNodePrograms(): void {
    this.configuration.sigmaSettings.defaultNodeType = this.configuration.defaultNodeType;

    this.configuration.sigmaSettings.nodeProgramClasses = {
      ring: NodeRingProgram,
      circle: NodeCircleProgram,
      rectangle: NodeRectangleProgram,
      triangle: NodeTriangleProgram,
    };

    if (
      this.configuration.sigmaSettings.renderNodeBackdrop &&
      !this.configuration.sigmaSettings.nodeBackdropProgram
    ) {
      this.configuration.sigmaSettings.nodeBackdropProgram = NodeBackdropProgram;
    }
  }

  /**
   * Initialize all available event handlers.
   *
   * @internal
   */
  private initializeEventHandlers(): void {
    // context menu listeners
    this.initializeContextMenuListeners();

    // click and drag listeners
    this.initializeClickAndDragListeners();

    // hover highlight listeners
    this.initializeHoverHighlightingListeners();
  }

  /**
   * Initializes the context menu listeners. Loads all context menus as well as the
   * "suppressContextMenu" value from the {@link ILayoutConfiguration} and initializes
   * the listeners. When no {@link IContextMenu} is available, there will be no context
   * menu on a right click on a node. There's nothing like a default value for the
   * category attribute, if it is not present. If the category attribute is missing,
   * the node will not have a context menu.
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
    const allContextMenus = this.configuration.contextMenus;

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

      // retrieve node category
      const category = this.graphData.getNodeAttribute(node, "category");
      // if not present, return
      if (category === undefined) return;

      // retrieve nodes corresponding context menu
      const contextMenu = allContextMenus.entries[category];
      if (!contextMenu) return;

      // generate context menus content
      const contextMenuContent = document.createElement("ol");
      contextMenu.forEach((ci) => {
        const item: HTMLElement = document.createElement("li");
        const label: HTMLElement = document.createElement("span");
        const icon: HTMLElement = document.createElement("img");

        // set label
        label.innerHTML = ci.label;

        // set click listener
        item.addEventListener("click", () => {
          ci.callback(node);

          // hide the context menu that's open
          cmcontainer.className = cssHide;
          isContextMenuOpen = false;
        });

        // set icon
        if (ci.icon) {
          icon.setAttribute("src", ci.icon);
          icon.setAttribute(
            "style",
            "display: inline-block; height: 1em; overflow: hidden; background-repeat: no-repeat;"
          );
          item.appendChild(icon);
        }

        item.appendChild(label);

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

      // hide the node info box container
      this.hideNodeInfoBoxContainer(true);
    });

    this.container.addEventListener("click", () => {
      // hide node info box container if open
      this.hideNodeInfoBoxContainer();

      if (!isContextMenuOpen) return;
      if (!cmcontainer) return;

      // hide the context menu if open
      cmcontainer.className = cssHide;
      isContextMenuOpen = false;
    });

    // handles whether the default context menu is suppressed or not
    this.container.addEventListener("contextmenu", (event) => {
      const suppressContextMenu = this.configuration.suppressContextMenu;

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
  private initializeClickAndDragListeners(): void {
    if (!this.renderer) return;

    // used for dragging nodes
    const camera = this.renderer.getCamera();
    const mouseCaptor = this.renderer.getMouseCaptor();
    let draggedNode: number | undefined;

    // used for the info box on click
    const delta = 3;
    let startX: number;
    let startY: number;
    let node: string;

    this.renderer.on("downNode", (event) => {
      // get the position of the click and store the node that has been clicked
      startX = event.event.x;
      startY = event.event.y;
      node = event.node;

      if (this.appMode === AppMode.STATIC || event.event.original.button === 2)
        return;

      // enabled the dragging
      this.isNodeDragged = true;
      draggedNode = event.node;
      camera.disable();
    });

    mouseCaptor.on("mouseup", (event) => {
      // calculate the distance of the drag
      const diffX = Math.abs(event.x - startX);
      const diffY = Math.abs(event.y - startY);

      // if distance of drag is smaller than delta show
      // infoBoxContainer on click if enabled
      if (
        (event.original.button === 0 || event.original.button === 1) &&
        diffX < delta &&
        diffY < delta &&
        this.configuration.showNodeInfoBoxOnClick
      ) {
        const nodeInfoBox = this.configuration.nodeInfoBox;
        const nodeInfoBoxContainer = nodeInfoBox?.container;

        if (nodeInfoBox && nodeInfoBoxContainer && node) {
          const data = this.graphData.getNodeAttributes(node);

          // make the node info box visible
          this.generateNodeInfoBox(nodeInfoBox, nodeInfoBoxContainer, {
            key: node,
            label: data.label,
            color: data.color,
            size: data.size,
            x: event.x,
            y: event.y,
            score: data.score,
            category: data.category,
          });
        }
      }

      if (this.appMode === AppMode.STATIC) return;

      // disabled the node drag
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
   * @remarks - Regarding this.hideNodeInfoBoxContainer()
   * Since creating multiple events on "leaveNode" would overwrite existing ones
   * the hiding of the node info box container has to be done here, where the enterNode
   * and leaveNode events are being created for the sub graph highlighting.
   *
   * @internal
   */
  private initializeHoverHighlightingListeners(): void {
    if (!this.renderer) return;
    if (!this.configuration.highlightSubGraphOnHover) {
      // if highlighting the subgraph is disabled just add that the node info box container
      // will be hidden when leaving a node
      this.renderer.on("leaveNode", () => {
        this.hideNodeInfoBoxContainer();
      });

      return;
    }

    this.renderer.on("enterNode", ({ node }) => {
      this.hoveredNode = node;

      const directNeighbors = this.graphData.neighbors(node);

      for (let i = 0; i < directNeighbors.length; i++) {
        const neighbor = directNeighbors[i];
        let isAtLeastOneEdgeVisible = false;

        if (this.renderer?.settings.renderJustImportantEdges) {
          // add just if at least one edge between both nodes is visible
          this.graphData.edges(node, neighbor).forEach((edge) => {
            if (this.graphData.getEdgeAttribute(edge, "important") === true) {
              this.highlightedEdges.add(edge);
              isAtLeastOneEdgeVisible = true;
            }
          });
          this.graphData.edges(neighbor, node).forEach((edge) => {
            if (this.graphData.getEdgeAttribute(edge, "important") === true) {
              this.highlightedEdges.add(edge);
              isAtLeastOneEdgeVisible = true;
            }
          });

          if (isAtLeastOneEdgeVisible) {
            this.highlightedNodes.add(neighbor);
          }
        } else {
          // add the neighbor and all connected edges
          this.highlightedNodes.add(neighbor);
          this.graphData
            .edges(node, neighbor)
            .forEach((edge) => this.highlightedEdges.add(edge));
          this.graphData
            .edges(neighbor, node)
            .forEach((edge) => this.highlightedEdges.add(edge));
          isAtLeastOneEdgeVisible = true;
        }

        const importantNeighborsOfNeighbor: Array<NodeKey> = [];

        // if at least one edge between the node and the neighbor is visible
        // and important neighbors of the neighbor should be included
        // add the important neighbors of our nodes neighbor to an array
        if (
          isAtLeastOneEdgeVisible &&
          this.configuration.includeImportantNeighbors
        ) {
          this.graphData.forEachNeighbor(
            neighbor,
            (neighborNeighbor: NodeKey, attributes: Attributes) => {
              if (attributes.important === true) {
                importantNeighborsOfNeighbor.push(neighborNeighbor);
              }
            }
          );
        }

        // iterate through the array to make sure the neighbor is just included if there
        // is a visible edge between both
        for (let j = 0; j < importantNeighborsOfNeighbor.length; j++) {
          const neighborsImportantNeighbor = importantNeighborsOfNeighbor[j];

          let isAtLeastOneEdgeVisible = false;

          const edgesOut = this.graphData.edges(
            neighbor,
            neighborsImportantNeighbor
          );
          edgesOut.forEach((edge) => {
            if (
              this.renderer?.settings.renderJustImportantEdges === true &&
              this.graphData.getEdgeAttribute(edge, "important") === false
            ) {
              return;
            }

            isAtLeastOneEdgeVisible = true;
            this.highlightedEdges.add(edge);
          });

          // include both directions if enabled
          if (this.configuration.importantNeighborsBidirectional) {
            const edgesIn = this.graphData.edges(
              neighborsImportantNeighbor,
              neighbor
            );
            edgesIn.forEach((edge) => {
              if (
                this.renderer?.settings.renderJustImportantEdges === true &&
                this.graphData.getEdgeAttribute(edge, "important") === false
              ) {
                return;
              }

              isAtLeastOneEdgeVisible = true;
              this.highlightedEdges.add(edge);
            });
          }

          if (isAtLeastOneEdgeVisible) {
            this.highlightedNodes.add(neighborsImportantNeighbor);
          }
        }
      }

      // add the hovered node
      this.highlightedNodes.add(node);

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

      // hide the node info box container if visible
      this.hideNodeInfoBoxContainer();
    });
  }
}

export { WebGraph };
