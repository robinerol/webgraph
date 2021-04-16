/* eslint-disable  @typescript-eslint/no-explicit-any */

import Graph from "graphology";
import { WebGraph } from "../src";
import {
  DEFAULT_GRAPH_CONFIGURATION,
  Layout,
  NodeType,
} from "../src/Configuration/index";
import { IGraphConfiguration } from "../types/Configuration";
import { WebGLRenderer } from "sigma";
import { SerializedEdge, SerializedNode } from "graphology-types";

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
        process: jest.fn().mockImplementation(() => {
          return {};
        }),
        refresh: jest.fn().mockImplementation(() => {
          return {};
        }),
        settings: jest.fn().mockImplementation(() => {
          return {
            defaultNodeType: jest.fn().mockImplementation(() => {
              return {};
            }),
          };
        }),
      };
    }),
    AbstractNodeProgram: jest.fn().mockImplementation(() => {
      return {};
    }),
    easings: jest.fn().mockImplementation(() => {
      return {};
    }),
    animateNodes: jest.fn().mockImplementation(() => {
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
    let graph: Graph;
    let webGraph: WebGraph;

    const testNode1 = {
      key: "n1",
    };

    const testNode2 = {
      key: "n2",
    };

    const testNode3 = {
      key: "n3",
    };

    const testEdge = {
      key: "testEdge",
      source: "n1",
      target: "n2",
    };

    beforeEach(() => {
      const container = document.createElement("div");
      graph = new Graph();

      graph.addNode(testNode1.key);
      graph.addNode(testNode2.key);
      graph.addNode(testNode3.key);
      graph.addEdgeWithKey(testEdge.key, testEdge.source, testEdge.target);

      webGraph = new WebGraph(container, graph);
      webGraph.render();
    });

    it("should overwrite edge attributes/merge edge", () => {
      const edges = new Set<SerializedEdge>();

      const edge = {
        key: testEdge.key,
        source: testEdge.source,
        target: testEdge.target,
        attributes: {
          abc: "556677abc",
        },
      };

      edges.add(edge);

      const exportedGraphBefore = webGraph.exportGraph();

      expect(exportedGraphBefore.edges).not.toContainEqual(edge);

      webGraph.mergeEdges(edges);

      const exportedGraphAfter = webGraph.exportGraph();

      expect(exportedGraphAfter.edges).toContainEqual(edge);
      expect(exportedGraphAfter.edges).toHaveLength(1);
    });

    it("should add edge", () => {
      const edges = new Set<SerializedEdge>();

      const edge1 = {
        key: testEdge.key,
        source: testEdge.source,
        target: testEdge.target,
        attributes: {
          abc: "556677abc",
        },
      };

      const edge2 = {
        key: "iAnSnEn72",
        source: "n2",
        target: "n3",
      };

      edges.add(edge1);
      edges.add(edge2);

      const exportedGraphBefore = webGraph.exportGraph();

      expect(exportedGraphBefore.edges).not.toContainEqual(edge1);
      expect(exportedGraphBefore.edges).not.toContainEqual(edge2);

      webGraph.mergeEdges(edges);

      const exportedGraphAfter = webGraph.exportGraph();

      expect(exportedGraphAfter.edges).toContainEqual(edge1);
      expect(exportedGraphAfter.edges).toContainEqual(edge2);
      expect(exportedGraphAfter.edges).toHaveLength(2);
    });

    it("should replace edges", () => {
      const edges = new Set<SerializedEdge>();

      const edge1 = {
        key: "dU3Js(k9",
        source: "n2",
        target: "n1",
      };

      const edge2 = {
        key: "iAnSnEn72",
        source: "n2",
        target: "n3",
      };

      edges.add(edge1);
      edges.add(edge2);

      const exportedGraphBefore = webGraph.exportGraph();

      expect(exportedGraphBefore.edges).not.toContainEqual(edge1);
      expect(exportedGraphBefore.edges).not.toContainEqual(edge2);

      webGraph.replaceEdges(edges);

      const exportedGraphAfter = webGraph.exportGraph();

      expect(exportedGraphAfter.edges).toContainEqual(edge1);
      expect(exportedGraphAfter.edges).toContainEqual(edge2);
      expect(exportedGraphAfter.edges).not.toContainEqual(testEdge);
      expect(exportedGraphAfter.edges).toHaveLength(2);
    });

    it("should overwrite node attributes/merge node", () => {
      const nodes = new Array<SerializedNode>();

      const node = {
        key: testNode1.key,
        attributes: {
          abc: "556677abc",
        },
      };

      nodes.push(node);

      const exportedGraphBefore = webGraph.exportGraph();

      expect(exportedGraphBefore.nodes).not.toContainEqual(node);

      webGraph.mergeNodes(nodes);

      const exportedGraphAfter = webGraph.exportGraph();

      expect(exportedGraphAfter.nodes).toContainEqual(node);
      expect(exportedGraphAfter.nodes).toHaveLength(3);
    });

    it("should drop nodes", () => {
      const nodes = new Array<SerializedNode>();

      const node = {
        key: "su3ds9dja",
        attributes: {
          abc: "3867387643",
        },
      };

      nodes.push(node);
      nodes.push(testNode1);
      nodes.push(testNode3);

      const exportedGraphBefore = webGraph.exportGraph();

      expect(exportedGraphBefore.nodes).not.toContainEqual(node);
      expect(exportedGraphBefore.nodes).toContainEqual(testNode1);
      expect(exportedGraphBefore.nodes).toContainEqual(testNode3);
      expect(exportedGraphBefore.nodes).toHaveLength(3);

      webGraph.dropNodes(nodes);

      const exportedGraphAfter = webGraph.exportGraph();

      expect(exportedGraphAfter.nodes).not.toContainEqual(node);
      expect(exportedGraphAfter.nodes).not.toContainEqual(testNode1);
      expect(exportedGraphAfter.nodes).not.toContainEqual(testNode3);
      expect(exportedGraphAfter.nodes).toHaveLength(1);
    });

    it("should add node", () => {
      const nodes = new Array<SerializedNode>();

      const node2 = {
        key: "su3ds9dja",
        attributes: {
          abc: "3867387643",
        },
      };

      nodes.push(node2);

      const exportedGraphBefore = webGraph.exportGraph();

      expect(exportedGraphBefore.nodes).not.toContainEqual(node2);
      expect(exportedGraphBefore.nodes).toHaveLength(3);

      webGraph.mergeNodes(nodes);

      const exportedGraphAfter = webGraph.exportGraph();

      expect(exportedGraphAfter.nodes).toContainEqual(node2);
      expect(exportedGraphAfter.nodes).toHaveLength(4);
    });
  });

  describe("layout and render", () => {
    let webGraph: WebGraph;
    const defaultLayout = Layout.RANDOM;
    const defaultLayoutConfig = {};
    const defaultNodeType = NodeType.RECTANGLE;

    beforeEach(() => {
      const container = document.createElement("div");
      const graph = new Graph();

      const testNode1 = {
        key: "n1",
      };

      const testNode2 = {
        key: "n2",
      };

      const testNode3 = {
        key: "n3",
      };

      const testEdge = {
        key: "testEdge",
        source: "n1",
        target: "n2",
      };

      graph.addNode(testNode1.key);
      graph.addNode(testNode2.key);
      graph.addNode(testNode3.key);
      graph.addEdgeWithKey(testEdge.key, testEdge.source, testEdge.target);

      webGraph = new WebGraph(container, graph, {
        layout: defaultLayout,
        layoutConfiguration: defaultLayoutConfig,
        defaultNodeType: defaultNodeType,
      });
      webGraph.render();
    });

    it("should set and apply layout", () => {
      expect(webGraph["configuration"].layout).toEqual(defaultLayout);
      expect(webGraph["configuration"].layoutConfiguration).toEqual(
        defaultLayoutConfig
      );

      const newLayout = Layout.CIRCULAR;
      const newLayoutConfig = { circularLayoutOptions: {} };

      webGraph.setAndApplyLayout(newLayout, newLayoutConfig);

      expect(webGraph["configuration"].layout).toEqual(newLayout);
      expect(webGraph["configuration"].layoutConfiguration).toEqual(
        newLayoutConfig
      );
    });

    it("should reapply layout", () => {
      expect(webGraph["configuration"].layout).toEqual(defaultLayout);
      expect(webGraph["configuration"].layoutConfiguration).toEqual(
        defaultLayoutConfig
      );

      webGraph.reapplyLayout();

      expect(webGraph["configuration"].layout).toEqual(defaultLayout);
      expect(webGraph["configuration"].layoutConfiguration).toEqual(
        defaultLayoutConfig
      );
    });

    it("should reapply layout force atlas 2 and overwrite preAppliedLayout", () => {
      expect(webGraph["configuration"].layout).toEqual(defaultLayout);
      expect(webGraph["configuration"].layoutConfiguration).toEqual(
        defaultLayoutConfig
      );

      const newLayout = Layout.FORCEATLAS2;
      const newLayoutConfig = {
        forceAtlas2LayoutOptions: {
          iterations: 5,
          preAppliedLayout: Layout.RANDOM,
        },
      };

      webGraph.setAndApplyLayout(newLayout, newLayoutConfig);

      expect(webGraph["configuration"].layout).toEqual(newLayout);
      expect(webGraph["configuration"].layoutConfiguration).toEqual(
        newLayoutConfig
      );

      webGraph.reapplyLayout();

      const expectedLayoutOptions = {
        forceAtlas2LayoutOptions: {
          iterations: 5,
          preAppliedLayout: undefined,
        },
      };

      expect(webGraph["configuration"].layout).toEqual(newLayout);
      expect(webGraph["configuration"].layoutConfiguration).toEqual(
        expectedLayoutOptions
      );
    });

    it("should set and apply default node type", () => {
      expect(webGraph["configuration"].defaultNodeType).toEqual(
        defaultNodeType
      );

      const newType = NodeType.RING;

      webGraph.setAndApplyDefaultNodeType(newType);

      expect(webGraph["configuration"].defaultNodeType).toEqual(newType);
    });
  });

  describe("history", () => {
    it("should enable history", () => {
      const container = document.createElement("div");
      const webGraph = new WebGraph(container, new Graph(), {
        enableHistory: true,
      });
      webGraph.render();

      expect(webGraph["isHistoryEnabled"]).toBeTruthy();
      expect(webGraph["history"]).toBeDefined();
    });

    it("should disabled history", () => {
      const container = document.createElement("div");
      const webGraph = new WebGraph(container, new Graph(), {
        enableHistory: false,
      });
      webGraph.render();

      expect(webGraph["isHistoryEnabled"]).toBeFalsy();
      expect(webGraph["history"]).toBeUndefined();
    });

    describe("history actions", () => {
      let webGraph: WebGraph;

      const layout = Layout.RANDOM;
      const layoutConfig = { randomLayoutOptions: {} };
      const nodeType = NodeType.RECTANGLE;
      const nodeTypeTwo = NodeType.CIRCLE;

      beforeEach(() => {
        const container = document.createElement("div");
        webGraph = new WebGraph(container, new Graph(), {
          enableHistory: true,
        });

        webGraph.render();

        expect(webGraph["isHistoryEnabled"]).toBeTruthy();
        expect(webGraph["history"]).toBeDefined();

        webGraph.setAndApplyLayout(layout, layoutConfig);
        webGraph.setAndApplyDefaultNodeType(nodeType);
        webGraph.setAndApplyDefaultNodeType(nodeTypeTwo);

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeTypeTwo);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );
      });

      it("should undo latest action", () => {
        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeType);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );
      });

      it("should undo last two actions", () => {
        webGraph.undo();
        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(
          DEFAULT_GRAPH_CONFIGURATION.defaultNodeType
        );
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );
      });

      it("should redo latest undone action", () => {
        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeType);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );

        webGraph.redo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeTypeTwo);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );
      });

      it("should undo two then redo one action", () => {
        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeType);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );

        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(
          DEFAULT_GRAPH_CONFIGURATION.defaultNodeType
        );
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );

        webGraph.redo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeType);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );
      });

      it("should undo three then redo three actions", () => {
        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeType);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );

        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(
          DEFAULT_GRAPH_CONFIGURATION.defaultNodeType
        );
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );

        webGraph.undo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(
          DEFAULT_GRAPH_CONFIGURATION.defaultNodeType
        );
        expect(webGraph["configuration"].layout).toEqual(
          DEFAULT_GRAPH_CONFIGURATION.layout
        );
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          DEFAULT_GRAPH_CONFIGURATION.layoutConfiguration
        );

        webGraph.redo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(
          DEFAULT_GRAPH_CONFIGURATION.defaultNodeType
        );
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );

        webGraph.redo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeType);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );

        webGraph.redo();

        expect(webGraph["configuration"].defaultNodeType).toEqual(nodeTypeTwo);
        expect(webGraph["configuration"].layout).toEqual(layout);
        expect(webGraph["configuration"].layoutConfiguration).toEqual(
          layoutConfig
        );
      });
    });
  });
});
