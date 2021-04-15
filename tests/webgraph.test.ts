/* eslint-disable  @typescript-eslint/no-explicit-any */

import Graph from "graphology";
import { WebGraph } from "../src";
import {
  DEFAULT_GRAPH_CONFIGURATION,
  Layout,
} from "../src/Configuration/index";
import { IGraphConfiguration } from "../types/Configuration";
import { WebGLRenderer } from "sigma";

jest.mock("sigma", () => {
  return {
    WebGLRenderer: jest.fn().mockImplementation(() => {
      return {
        getCamera: jest.fn().mockImplementation(() => {
          return {};
        }),
        getMouseCaptor: jest.fn().mockImplementation(() => {
          return {
            on: jest.fn().mockImplementation(() => {
              return {};
            }),
            removeAllListeners: jest.fn().mockImplementation(() => {
              return {};
            }),
          };
        }),
        on: jest.fn().mockImplementation(() => {
          return {};
        }),
        clear: jest.fn().mockImplementation(() => {
          return {};
        }),
        removeAllListeners: jest.fn().mockImplementation(() => {
          return {};
        }),
        kill: jest.fn().mockImplementation(() => {
          return {};
        }),
      };
    }),
    AbstractNodeProgram: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

describe("test public methods of the WebGraph class", () => {
  describe("constructor", () => {
    it("should create the same config as no configuration", () => {
      const container1 = document.createElement("div");
      const container2 = document.createElement("div");

      const webGraph1 = new WebGraph(container1, new Graph(), {});
      const webGraph2 = new WebGraph(container2, new Graph());

      expect(webGraph1).toStrictEqual(webGraph2);
    });

    it("should be the default configuration", () => {
      const container = document.createElement("div");

      const webGraph = new WebGraph(container, new Graph());

      expect(webGraph["configuration"]).toEqual(DEFAULT_GRAPH_CONFIGURATION);
    });

    it("should apply configurations correctly", () => {
      const container = document.createElement("div");

      const layout = Layout.RANDOM;
      const includeImportantNeighbors = !DEFAULT_GRAPH_CONFIGURATION.includeImportantNeighbors;
      const suppressContextMenu = !DEFAULT_GRAPH_CONFIGURATION.suppressContextMenu;
      const labelFont = "RANDOM FONT";

      const config: Partial<IGraphConfiguration> = {
        layout: layout,
        includeImportantNeighbors: includeImportantNeighbors,
        suppressContextMenu: suppressContextMenu,
        sigmaSettings: {
          labelFont: labelFont,
        },
      };

      const webGraph = new WebGraph(container, new Graph(), config);

      // copy by value
      const finalConfig = JSON.parse(
        JSON.stringify(DEFAULT_GRAPH_CONFIGURATION)
      );
      finalConfig.layout = layout;
      finalConfig.includeImportantNeighbors = includeImportantNeighbors;
      finalConfig.suppressContextMenu = suppressContextMenu;
      finalConfig.sigmaSettings.labelFont = labelFont;

      expect(webGraph["configuration"]).toEqual(finalConfig);
    });
  });

  describe("render", () => {
    let webGraph: WebGraph;

    beforeAll(() => {
      const container = document.createElement("div");

      webGraph = new WebGraph(container, new Graph());
    });

    it("should be inactive", () => {
      expect(webGraph.isRenderingActive).toBeFalsy();
    });

    it("should be active", () => {
      webGraph.render();
      expect(webGraph.isRenderingActive).toBeTruthy();
    });

    it("should be default AppMode", () => {
      expect(webGraph.appMode).toEqual(DEFAULT_GRAPH_CONFIGURATION.appMode);
    });
  });

  describe("lifecycle methods", () => {
    it("should throw error if rendering is active already", () => {
      const container = document.createElement("div");

      const webGraph = new WebGraph(container, new Graph());
      webGraph.render();

      expect(webGraph.isRenderingActive).toBeTruthy();

      expect(() => webGraph.render()).toThrow();
    });

    it("should call internal methods on render", () => {
      const container = document.createElement("div");

      const webGraph = new WebGraph(container, new Graph(), {
        enableHistory: true,
      });
      spyOn<any>(webGraph, "applyLayout");
      spyOn<any>(webGraph, "overwriteRenderSettings");
      spyOn<any>(webGraph, "initializeEventHandlers");

      expect(webGraph["history"]).toBeUndefined;

      webGraph.render();

      expect(WebGLRenderer).toHaveBeenCalled();
      expect(webGraph["applyLayout"]).toHaveBeenCalled();
      expect(webGraph["overwriteRenderSettings"]).toHaveBeenCalled();
      expect(webGraph["initializeEventHandlers"]).toHaveBeenCalled();
      expect(webGraph["history"]).toBeDefined();
    });

    it("should reset everything on destroy", () => {
      const container = document.createElement("div");

      const webGraph = new WebGraph(container, new Graph());
      webGraph.render();

      expect(webGraph.isRenderingActive).toBeTruthy();

      webGraph.destroy();

      expect(webGraph.isRenderingActive).toBeFalsy();
      expect(webGraph["renderer"]?.removeAllListeners).toHaveBeenCalled();
      expect(webGraph["renderer"]?.clear).toHaveBeenCalled();
      expect(webGraph["renderer"]?.kill).toHaveBeenCalled();
    });

    it("should return exact same graph on export", () => {
      const container = document.createElement("div");

      const n1 = "abc";
      const n2 = "def";
      const e = "qwerty";

      const graph = new Graph();
      graph.addNode(n1);
      graph.addNode(n2);
      graph.addEdgeWithKey(e, n1, n2);

      const webGraph = new WebGraph(container, graph);

      const exportedGraph = webGraph.exportGraph();

      expect(exportedGraph.nodes).toContainEqual({ key: n1 });
      expect(exportedGraph.nodes).toContainEqual({ key: n2 });
      expect(exportedGraph.edges).toContainEqual({
        key: e,
        source: n1,
        target: n2,
      });
    });

    it("should exclude edges on export if requested", () => {
      const container = document.createElement("div");

      const n1 = "abc";
      const n2 = "def";
      const e = "qwerty";

      const graph = new Graph();
      graph.addNode(n1);
      graph.addNode(n2);
      graph.addEdgeWithKey(e, n1, n2);

      const webGraph = new WebGraph(container, graph);

      const exportedGraph = webGraph.exportGraph(true);

      expect(exportedGraph.nodes).toContainEqual({ key: n1 });
      expect(exportedGraph.nodes).toContainEqual({ key: n2 });
      expect(exportedGraph.edges).toEqual([]);
    });
  });

  describe("graph manipulation", () => {
    const graph = new Graph();

    beforeAll(() => {
      const container = document.createElement("div");

      const webGraph = new WebGraph(container, graph);
      webGraph.render();
    });

    it("should merge edges", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should add edges", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should overwrite edge attributes", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should merge nodes", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should drop nodes", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should add nodes", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should overwrite node attributes", () => {
      //TODO
      expect(true).toBeTruthy();
    });
  });

  describe("layout and render", () => {
    it("should toggle edge rendering", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should toggle rendering just important edges", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should reapply layout", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should set and apply layout", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should set and apply default node type", () => {
      //TODO
      expect(true).toBeTruthy();
    });
  });

  describe("history", () => {
    it("should enable history", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should disabled history", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should undo latest action", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should undo last two actions", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should redo latest undone action", () => {
      //TODO
      expect(true).toBeTruthy();
    });

    it("should undo two then redo one action", () => {
      //TODO
      expect(true).toBeTruthy();
    });
  });
});
