import {
  AppMode,
  ILayoutConfiguration,
  Layout,
  NodeShape,
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
  UPDATE_NODE_SHAPE = "update_node_shape",

  // Edges
  UPDATE_EDGES = "update_edges",
  TOGGLE_EDGE_RENDERING = "toggle_edge_rendering",

  // Layout
  SET_LAYOUT = "set_layout",
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
  nodeShape?: NodeShape;
  edges?: Set<SerializedEdge>;
  toggleEdgeRendering?: boolean;
  layout?: Layout;
  layoutConfig?: ILayoutConfiguration;
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
