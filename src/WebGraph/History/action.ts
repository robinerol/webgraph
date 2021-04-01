import {
  AppMode,
  ILayoutConfiguration,
  Layout,
  NodeShape,
} from "../../Configuration";
import { SerializedNode, SerializedEdge } from "graphology-types";

/**
 * WIP
 */
enum ActionType {
  // AppMode
  UPDATE_APP_MODE = "update_app_mode",

  // Nodes
  ADD_NODE = "add_node",
  DROP_NODE = "drop_node",
  UPDATE_NODE_DATA = "update_node_data",
  UPDATE_NODE_SHAPE = "update_node_shape",

  // Edges
  UPDATE_EDGES = "update_edges",
  TOGGLE_EDGE_RENDERING = "toggle_edge_rendering",

  // Layout
  SET_LAYOUT = "set_layout",
  SET_LAYOUT_CONFIG = "set_layout_config",
}

/**
 * WIP
 */
interface IActionPayload {
  appMode?: AppMode;
  node?: SerializedNode;
  nodeShape?: NodeShape;
  edge?: SerializedEdge;
  toggleEdgeRendering?: boolean;
  layout?: Layout;
  layoutConfig?: ILayoutConfiguration;
}

/**
 * WIP
 */
class Action {
  public previousAction: Action | undefined;
  public followingAction: Action | undefined;

  public actionType: ActionType;
  public newData: IActionPayload;
  public oldData: IActionPayload;

  constructor(
    oldData: IActionPayload,
    actionType: ActionType,
    newData: IActionPayload,
    previousAction: Action | undefined
  ) {
    this.oldData = oldData;
    this.actionType = actionType;
    this.newData = newData;
    this.previousAction = previousAction;
  }

  public getLatestAction(): Action | undefined {
    let followingAction = this.followingAction;

    while (followingAction?.followingAction) {
      followingAction = followingAction.followingAction;
    }

    return followingAction ? followingAction : this;
  }
}

export { Action, ActionType, IActionPayload };
