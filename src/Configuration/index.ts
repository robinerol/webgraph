import { Layout, ILayoutConfiguration } from "./layouts";
import { AppMode } from "./appmode";
import { IContextMenu } from "./contextmenu";
import { IHoverCallback } from "./hovercallback";
import { NodeType } from "./nodetype";
import {
  WebGLSettings,
  WEBGL_RENDERER_DEFAULT_SETTINGS,
} from "sigma/src/renderers/webgl/settings";

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
  hoverCallbacks?: IHoverCallback;
  highlightSubGraphOnHover: boolean;
  subGraphHighlightColor: string;
  defaultNodeType: NodeType;
  enableHistory: boolean;
}

/**
 * Representing the default value for the {@link IGraphConfiguration}.
 *
 * {@label defaultGraphConfiguration}
 */
const DEFAULT_GRAPH_CONFIGURATION: IGraphConfiguration = {
  sigmaSettings: WEBGL_RENDERER_DEFAULT_SETTINGS,
  layout: Layout.PREDEFINED,
  layoutConfiguration: {
    predefinedLayoutOptions: {},
  },
  appMode: AppMode.STATIC,
  suppressContextMenu: true,
  highlightSubGraphOnHover: true,
  subGraphHighlightColor: "#e57a2d",
  defaultNodeType: NodeType.RING,
  enableHistory: false,
};

export * from "./layouts";
export * from "./appmode";
export * from "./contextmenu";
export * from "./hovercallback";
export * from "./nodetype";
export { IGraphConfiguration, DEFAULT_GRAPH_CONFIGURATION };
