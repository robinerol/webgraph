/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  WebGraph,
  Utils,
  Layout,
  DEFAULT_FORCEATLAS2_ITERATIONS,
  AppMode,
  NodeType,
  LabelSelector,
} from "../src/index";
import Graph, { MultiGraph } from "graphology";

/**---------------------------------------------------------------------------
 * Graph drawing
 *--------------------------------------------------------------------------*/
let webGraph: WebGraph | undefined = undefined;
const webGraphContainer = document.getElementById("webGraph");
const webGraphContextMenuContainer = document.getElementById("webGraphCM");
const webGraphHoverContainer = document.getElementById("webGraphHC");

function drawGraph(graphDataJSON: any[]) {
  if (!webGraphContainer) {
    throw new Error("No div container with the ID 'webGraph' has been found.");
  }

  if (!webGraphContextMenuContainer) {
    throw new Error(
      "No div container with the ID 'webGraphCM' has been found."
    );
  }

  if (!webGraphHoverContainer) {
    throw new Error(
      "No div container with the ID 'webGraphHC' has been found."
    );
  }

  const graph = new MultiGraph();

  const COLOR_PALETTE = [
    "#EDAE49",
    "#D1495B",
    "#00798C",
    "#30638E",
    "#003D5B",
    "#BBBDF6",
  ];

  let minScore = 10000;
  let maxScore = 0;
  let minYear = 10000;
  let maxYear = 0;

  graphDataJSON.forEach((node) => {
    if (node.score < minScore) minScore = node.score;
    if (node.score > maxScore) maxScore = node.score;
    if (node.content.year < minYear) minYear = node.content.year;
    if (node.content.year > maxYear) maxYear = node.content.year;
  });

  // create nodes
  graphDataJSON.forEach((result) => {
    graph.addNode(result.id, {
      label: "XYZ, " + result.content.year,
      size: Utils.getNodeSizeForValue(result.score, minScore, maxScore, 4),
      category: Math.round(Math.random()),
      color: Utils.getNodeColorForValue(
        result.content.year,
        minYear,
        maxYear,
        COLOR_PALETTE
      ),
      score: result.score,
    });

    if (Math.random() < 0.75) {
      graph.setNodeAttribute(result.id, "cluster", Math.round(Math.random()));
    }

    if (Math.random() < 0.3) {
      graph.setNodeAttribute(result.id, "important", Math.round(Math.random()));
    }
  });

  // create random edges
  const nodes = graph.nodes();
  for (let i = 0; i < nodes.length; i++) {
    const sourceNode = nodes[Math.round(Math.random() * nodes.length - 1)];
    const targetNode = nodes[Math.round(Math.random() * nodes.length - 1)];

    if (!sourceNode || !targetNode) continue;

    graph.addEdge(sourceNode, targetNode, {
      weight: Math.random(),
      color: "#ccc",
      important: Math.random() > 0.7,
    });
  }

  if (webGraph?.isRenderingActive) webGraph.destroy();

  // initialize and render graph
  webGraph = new WebGraph(webGraphContainer, graph, {
    layout: Layout.FORCEATLAS2,
    layoutConfiguration: {
      forceAtlas2LayoutOptions: {
        iterations: DEFAULT_FORCEATLAS2_ITERATIONS,
        preAppliedLayout: Layout.CIRCLEPACK,
        settings: {
          edgeWeightInfluence: 1,
        },
      },
    },
    appMode: AppMode.DYNAMIC,
    hoverCallbacks: {
      container: webGraphHoverContainer,
      cssShow: "show-hover",
      cssHide: "hide",
      xoffset: -75,
      yoffset: 20,
      callback: {
        0: async (key: string, score?: number) => {
          const dataJson: any = await fetch(
            "http://localhost:9002/node?q=" + key
          )
            .then((response) => response.json())
            .then((json) => json);

          if (!dataJson) return { header: "error" };

          return {
            preheader: dataJson.year,
            header: dataJson.originalTitle,
            content: dataJson.publisher,
            footer: "Score: " + score,
          };
        },
        1: async (key: string) => {
          const dataJson: any = await fetch(
            "http://localhost:9002/node?q=" + key
          )
            .then((response) => response.json())
            .then((json) => json);

          if (!dataJson) return { header: "error" };

          return {
            preheader: dataJson.year,
            header: dataJson.originalTitle,
            content: dataJson.publisher,
          };
        },
      },
    },
    contextMenus: {
      container: webGraphContextMenuContainer,
      cssHide: "hide",
      cssShow: "show",
      entries: {
        0: [
          {
            label: "drop node",
            callback: (key: string) => webGraph?.dropNodes([key]),
          },
          {
            label: "type triangle",
            callback: (key: string) =>
              webGraph?.mergeNodes([
                { key: key, attributes: { type: NodeType.TRIANGLE } },
              ]),
          },
          {
            label: "type rectangle",
            callback: (key: string) =>
              webGraph?.mergeNodes([
                { key: key, attributes: { type: NodeType.RECTANGLE } },
              ]),
          },
        ],
        1: [
          {
            label: "drop node",
            callback: (key: string) => webGraph?.dropNodes([key]),
          },
          {
            label: "hide node",
            callback: (key: string) =>
              webGraph?.mergeNodes([
                { key: key, attributes: { hidden: true } },
              ]),
          },
          {
            label: "show node",
            callback: (key: string) =>
              webGraph?.mergeNodes([
                { key: key, attributes: { hidden: false } },
              ]),
          },
        ],
      },
    },
    suppressContextMenu: false,
    defaultNodeType: NodeType.CIRCLE,
    highlightSubGraphOnHover: true,
    enableHistory: true,
    labelSelector: LabelSelector.LEVELS,
    sigmaSettings: {
      renderLabels: true,
      labelFontColor: "#8e8e8e",
      renderNodeBackdrop: true,
      clusterColors: { 0: "#d1fce9", 1: "#d1dcfc" },
    },
  });

  webGraph.render();
}

function drawExampleGraph() {
  if (!webGraphContainer) {
    throw new Error("No div container with the ID 'webGraph' has been found.");
  }

  const graph = new Graph();

  graph.addNode("Node 1", {
    label: "Node 1",
    x: 1,
    y: 1,
    color: "#D1495B",
    size: 10,
    type: NodeType.RECTANGLE,
  });

  graph.addNode("Node 2", {
    label: "Node 2",
    x: 1,
    y: 0,
    color: "#EDAE49",
    size: 10,
    type: NodeType.TRIANGLE,
  });

  graph.addNode("Node 3", {
    label: "Node 3",
    x: 0,
    y: 0,
    color: "#30638E",
    size: 10,
  });

  graph.addEdge("Node 1", "Node 2", {
    weight: 0.5,
    color: "#ccc",
    important: true,
  });
  graph.addEdge("Node 1", "Node 3", { weight: 1.0, color: "#ccc" });

  if (webGraph?.isRenderingActive) webGraph.destroy();

  webGraph = new WebGraph(webGraphContainer, graph);

  webGraph.render();
}

window.onload = () => {
  if (webGraphContainer === null) return;

  // render default graph example
  drawExampleGraph();
};

/**---------------------------------------------------------------------------
 * Settings Menu
 *--------------------------------------------------------------------------*/
/**---------------------------------
 * Settings Menu - API endpoint
 *--------------------------------*/
document.getElementById("searchButton")?.addEventListener("click", (e) => {
  e.preventDefault();

  const searchEndpointElement = document.getElementById("searchEndpoint");
  const searchInputElement = document.getElementById("searchInput");

  if (!searchEndpointElement || !searchInputElement) return;

  // parse inputs to url
  const url =
    (<HTMLInputElement>searchEndpointElement).value +
    encodeURIComponent((<HTMLInputElement>searchInputElement).value);

  fetchGraphData(url);
});

async function fetchGraphData(url: string) {
  // fetch json resource
  await fetch(url)
    .then((response) => response.json())
    .then((json) => drawGraph(json))
    .catch((e) => {
      console.error(e);
      drawExampleGraph();
    });
}

/**---------------------------------
 * Settings Menu - App Mode
 *--------------------------------*/
document.getElementById("appModeDynamic")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.appMode = AppMode.DYNAMIC;
});

document.getElementById("appModeStatic")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.appMode = AppMode.STATIC;
});

/**---------------------------------
 * Settings Menu - Layout
 *--------------------------------*/
document.getElementById("layoutRandom")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyLayout(Layout.RANDOM, {});
});

document.getElementById("layoutCircular")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyLayout(Layout.CIRCULAR, {});
});

document.getElementById("layoutCirclePack")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyLayout(Layout.CIRCLEPACK, {});
});

document.getElementById("layoutForceAtlas2")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyLayout(Layout.FORCEATLAS2, {
    forceAtlas2LayoutOptions: {
      iterations: DEFAULT_FORCEATLAS2_ITERATIONS,
      settings: {
        edgeWeightInfluence: 1,
      },
    },
  });
});

document.getElementById("layoutReapply")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.reapplyLayout();
});

/**---------------------------------
 * Settings Menu - Edges
 *--------------------------------*/
document.getElementById("edgeShow")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.toggleEdgeRendering(false);
});

document.getElementById("edgeHide")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.toggleEdgeRendering(true);
});

/**---------------------------------
 * Settings Menu - Important Edges
 *--------------------------------*/
document.getElementById("impEdgeShow")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.toggleJustImportantEdgeRendering(true);
});

document.getElementById("impEdgeHide")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.toggleJustImportantEdgeRendering(false);
});

/**---------------------------------
 * Settings Menu - Defualt Node Type
 *--------------------------------*/
document.getElementById("typeRing")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyDefaultNodeType(NodeType.RING);
});

document.getElementById("typeCircle")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyDefaultNodeType(NodeType.CIRCLE);
});

document.getElementById("typeRectangle")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyDefaultNodeType(NodeType.RECTANGLE);
});

document.getElementById("typeTriangle")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyDefaultNodeType(NodeType.TRIANGLE);
});

/**---------------------------------
 * Settings Menu - History
 *--------------------------------*/
document.getElementById("undo")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.undo();
});

document.getElementById("redo")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.redo();
});

/**---------------------------------
 * Settings Menu - Camera
 *--------------------------------*/
document.getElementById("zoomIn")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.camera.animatedUnzoom(0.75);
});

document.getElementById("zoomOut")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.camera.animatedZoom(0.75);
});

document.getElementById("zoomReset")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.camera.animatedReset({});
});
