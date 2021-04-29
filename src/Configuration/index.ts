import { Layout, ILayoutConfiguration } from "./layouts";
import { AppMode } from "./appmode";
import { IContextMenu } from "./contextmenu";
import { INodeInfoBox } from "./nodeinfobox";
import { NodeType } from "./nodetype";
import { WebGLSettings } from "sigma/types/renderers/webgl/settings";
import { LabelSelector } from "./labelselector";

/**
 * Interface for the graphs configurations.
 *
 * {@label IGraphConfiguration}
 */
interface IGraphConfiguration {
  sigmaSettings: Partial<WebGLSettings>;
  layout: Layout;
  layoutConfiguration: ILayoutConfiguration;
  appMode: AppMode;
  contextMenus?: IContextMenu;
  suppressContextMenu: boolean;
  disableHover: boolean;
  nodeInfoBox?: INodeInfoBox;
  showNodeInfoBoxOnClick: boolean;
  highlightSubGraphOnHover: boolean;
  subGraphHighlightColor: string;
  includeImportantNeighbors: boolean;
  importantNeighborsBidirectional: boolean;
  importantNeighborsColor?: string;
  defaultNodeType: NodeType;
  enableHistory: boolean;
  labelSelector: LabelSelector;
  initializeForceAtlas2WebWorker?: boolean;
}

/**
 * Representing the default value for the {@link IGraphConfiguration}.
 *
 * {@label defaultGraphConfiguration}
 */
const DEFAULT_GRAPH_CONFIGURATION: IGraphConfiguration = {
  sigmaSettings: {},
  layout: Layout.PREDEFINED,
  layoutConfiguration: {
    predefinedLayoutOptions: {},
  },
  appMode: AppMode.STATIC,
  suppressContextMenu: true,
  disableHover: false,
  showNodeInfoBoxOnClick: true,
  highlightSubGraphOnHover: true,
  subGraphHighlightColor: "#fc9044",
  includeImportantNeighbors: false,
  importantNeighborsBidirectional: false,
  defaultNodeType: NodeType.RING,
  enableHistory: false,
  labelSelector: LabelSelector.LEVELS,
  initializeForceAtlas2WebWorker: false,
};

export * from "./layouts";
export * from "./appmode";
export * from "./contextmenu";
export * from "./nodeinfobox";
export * from "./nodetype";
export * from "./labelselector";
export { IGraphConfiguration, DEFAULT_GRAPH_CONFIGURATION };
