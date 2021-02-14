/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
  WebGraph,
  Utils,
  Layout,
  DEFAULT_FORCEATLAS2_ITERATIONS,
} from "../src/index";
import Graph from "graphology";

const webGraphContainer = document.getElementById("webGraph");
const searchButton = document.getElementById("searchButton");
let webGraph: WebGraph;

searchButton?.addEventListener("click", (e) => {
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

function drawGraph(graphDataJSON: any[]) {
  if (!webGraphContainer) {
    throw new Error("No div container with the ID 'webGraph' has been found.");
  }

  const graph = new Graph();

  // create nodes
  graphDataJSON.forEach((result) => {
    graph.addNode(result.id, {
      label: result.content.originalTitle,
      size: Utils.getNodeSizeForValue(result.score, 25),
    });
  });

  if (webGraph?.isActive) webGraph.destroy();

  // initialize and render graph
  webGraph = new WebGraph(webGraphContainer, graph, {
    layout: Layout.FORCEATLAS2,
    layoutConfiguration: {
      forceAtlas2LayoutOptions: {
        iterations: DEFAULT_FORCEATLAS2_ITERATIONS,
        preAppliedLayout: Layout.CIRCULAR,
      },
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

  if (webGraph?.isActive) webGraph.destroy();

  webGraph = new WebGraph(webGraphContainer, graph);

  webGraph.render();
}

// render default graph example
if (webGraphContainer) {
  drawExampleGraph();
}
