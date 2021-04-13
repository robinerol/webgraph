import { Layout, ILayoutConfiguration } from "./layouts";
import { AppMode } from "./appmode";
import { IContextMenu } from "./contextmenu";
import { IHoverCallback } from "./hovercallback";
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
  hoverCallbacks?: IHoverCallback;
  highlightSubGraphOnHover: boolean;
  subGraphHighlightColor: string;
  defaultNodeType: NodeType;
  enableHistory: boolean;
  labelSelector: LabelSelector;
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
  highlightSubGraphOnHover: true,
  subGraphHighlightColor: "#e57a2d",
  defaultNodeType: NodeType.RING,
  enableHistory: false,
  labelSelector: LabelSelector.LEVELS,
};

export * from "./layouts";
export * from "./appmode";
export * from "./contextmenu";
export * from "./hovercallback";
export * from "./nodetype";
export * from "./labelselector";
export { IGraphConfiguration, DEFAULT_GRAPH_CONFIGURATION };
