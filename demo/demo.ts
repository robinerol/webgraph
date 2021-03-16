/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  WebGraph,
  Utils,
  Layout,
  DEFAULT_FORCEATLAS2_ITERATIONS,
  AppMode,
} from "../src/index";
import Graph from "graphology";

/**---------------------------------------------------------------------------
 * Graph drawing
 *--------------------------------------------------------------------------*/
let webGraph: WebGraph | undefined = undefined;
const webGraphContainer = document.getElementById("webGraph");

function drawGraph(graphDataJSON: any[]) {
  if (!webGraphContainer) {
    throw new Error("No div container with the ID 'webGraph' has been found.");
  }

  const graph = new Graph();

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
    contextMenus: {
      0: {
        entries: [
          {
            label: "delete node",
            callback: () => {
              console.log("todo: delete node");
            },
            icon: "https://test.test/test.jpg",
          },
        ],
      },
      1: {
        entries: [
          {
            label: "delete node",
            callback: () => {
              console.log("todo: delete node");
            },
            icon: "https://test.test/test.jpg",
          },
          {
            label: "add node",
            callback: () => {
              console.log("todo: add node");
            },
            icon: "https://test.test/test.jpg",
          },
        ],
      },
    },
    suppressContextMenu: false,
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
    color: "#FFA",
    size: 10,
  });

  graph.addNode("Node 2", {
    label: "Node 2",
    x: 1,
    y: 0,
    color: "#FAF",
    size: 10,
  });

  graph.addEdge("Node 1", "Node 2");

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
    },
  });
});
