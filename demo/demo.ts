/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  WebGraph,
  Utils,
  Layout,
  DEFAULT_FORCEATLAS2_ITERATIONS,
  AppMode,
  NodeShape,
} from "../src/index";
import Graph, { MultiGraph } from "graphology";

/**---------------------------------------------------------------------------
 * Graph drawing
 *--------------------------------------------------------------------------*/
let webGraph: WebGraph | undefined = undefined;
const webGraphContainer = document.getElementById("webGraph");

function drawGraph(graphDataJSON: any[]) {
  if (!webGraphContainer) {
    throw new Error("No div container with the ID 'webGraph' has been found.");
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

  // create nodes
  graphDataJSON.forEach((result) => {
    graph.addNode(result.id, {
      label: result.content.originalTitle.substring(0, 10) + "...",
      size: Utils.getNodeSizeForValue(result.score, 25),
      type: Math.round(Math.random()),
      color: COLOR_PALETTE[Math.round(Math.random() * 5)],
    });
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
    });
  }

  if (webGraph?.isRenderingActive) webGraph.destroy();

  // initialize and render graph
  webGraph = new WebGraph(webGraphContainer, graph, {
    layout: Layout.FORCEATLAS2,
    layoutConfiguration: {
      forceAtlas2LayoutOptions: {
        iterations: DEFAULT_FORCEATLAS2_ITERATIONS,
        preAppliedLayout: Layout.CIRCULAR,
      },
    },
    appMode: AppMode.DYNAMIC,
    hoverCallbacks: {
      0: {
        callback: (key: string) => console.log("type 0, hover over: " + key),
      },
      1: {
        callback: (key: string) => console.log("type 1, hover over: " + key),
      },
    },
    contextMenus: {
      0: {
        entries: [
          {
            label: "drop node",
            callback: (key: string) => webGraph?.dropNode(key),
            icon: "https://test.test/test.jpg",
          },
        ],
      },
      1: {
        entries: [
          {
            label: "drop node",
            callback: (key: string) => webGraph?.dropNode(key),
            icon: "https://test.test/test.jpg",
          },
          {
            label: "hide node",
            callback: (key: string) =>
              webGraph?.mergeNodes([
                { key: key, attributes: { hidden: true } },
              ]),
            icon: "https://test.test/test.jpg",
          },
          {
            label: "show node",
            callback: (key: string) =>
              webGraph?.mergeNodes([
                { key: key, attributes: { hidden: false } },
              ]),
            icon: "https://test.test/test.jpg",
          },
        ],
      },
    },
    suppressContextMenu: false,
    defaultNodeShape: NodeShape.RING,
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
  });

  graph.addNode("Node 2", {
    label: "Node 2",
    x: 1,
    y: 0,
    color: "#EDAE49",
    size: 10,
  });

  graph.addNode("Node 3", {
    label: "Node 3",
    x: 0,
    y: 0,
    color: "#30638E",
    size: 10,
  });

  graph.addEdge("Node 1", "Node 2", { weight: 0.5, color: "#ccc" });
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
      preAppliedLayout: Layout.CIRCULAR,
      settings: {
        edgeWeightInfluence: 1,
      },
    },
  });
});

/**---------------------------------
 * Settings Menu - Edges
 *--------------------------------*/
document.getElementById("edgeShow")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.toggleEdgeRendering(true);
});

document.getElementById("edgeHide")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.toggleEdgeRendering(false);
});

/**---------------------------------
 * Settings Menu - Node Shape
 *--------------------------------*/
document.getElementById("shapeRing")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyNodeShape(NodeShape.RING);
});

document.getElementById("shapeCircle")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyNodeShape(NodeShape.CIRCLE);
});

document.getElementById("shapeRectangle")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyNodeShape(NodeShape.RECTANGLE);
});

document.getElementById("shapeTriangle")?.addEventListener("click", (e) => {
  e.preventDefault();

  if (!webGraph || !webGraph.isRenderingActive) return;

  webGraph.setAndApplyNodeShape(NodeShape.TRIANGLE);
});
