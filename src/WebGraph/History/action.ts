import {
  AppMode,
  ILayoutConfiguration,
  Layout,
  NodeType,
} from "../../Configuration";
import { SerializedNode, SerializedEdge } from "graphology-types";

/**
 * Represents the type of an action performed on the {@link WebGraph}.
 *
 * {@label ActionType}
 */
enum ActionType {
  // AppMode
  UPDATE_APP_MODE = "update_app_mode",

  // Nodes
  DROP_NODE = "drop_node",
  UPDATE_OR_ADD_NODE = "update_or_add_node",
  UPDATE_NODE_TYPE = "update_node_type",

  // Edges
  REPLACE_EDGES = "replace_edges",
  UPDATE_OR_ADD_EDGE = "update_or_add_edge",
  TOGGLE_EDGE_RENDERING = "toggle_edge_rendering",
  TOGGLE_IMPORTANT_EDGE_RENDERING = "toggle_important_edge_rendering",

  // Layout
  SET_LAYOUT = "set_layout",
  SET_LAYOUT_WEB_WORKER = "set_layout_web_worker",
}

/**
 * A simple interface holding data necessary to perform and undo
 * an action.
 *
 * {@label IActionPayload}
 */
interface IActionPayload {
  appMode?: AppMode;
  nodes?: Array<SerializedNode>;
  nodeType?: NodeType;
  edges?: Set<SerializedEdge>;
  toggleEdgeRendering?: boolean;
  layout?: Layout;
  layoutConfig?: ILayoutConfiguration;
  layoutMapping?: { [key: string]: { x: number; y: number } };
}

/**
 * Class representing an action performed on the {@link WebGraph}.
 * Actions are being organized in a double linked list, where the first
 * action performed, is the one at the very start of the list while the
 * latest performed action is at the very end of the list.
 *
 * All actions are also holding a boolean indicating whether the action
 * has been reversed or not.
 *
 * If an action is the very first action, the previousAction is undefined.
 * If an action is the latest action, the followingAction is undefined.
 */
class Action {
  public previousAction: Action | undefined = undefined;
  public followingAction: Action | undefined = undefined;

  public actionType: ActionType;
  public newData: IActionPayload;
  public oldData: IActionPayload;

  public isReverted = false;

  constructor(
    oldData: IActionPayload,
    actionType: ActionType,
    newData: IActionPayload
  ) {
    this.oldData = oldData;
    this.actionType = actionType;
    this.newData = newData;
  }
}

export { Action, ActionType, IActionPayload };
