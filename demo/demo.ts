import { WebGraph } from "../src/index";
import DirectedGraph from "graphology";

const container = document.getElementById("webgraph");

if (container != null) {
  const graph = new DirectedGraph();

  graph.addNode("Node 1", {
    label: "Node 1",
    x: -2,
    y: 1,
    color: "#FFA",
    size: 10,
  });

  graph.addNode("Node 2", {
    label: "Node 2",
    x: 1,
    y: 2,
    color: "#FAF",
    size: 5,
  });

  graph.addNode("Node 3", {
    label: "Node 3",
    x: 2,
    y: -1,
    color: "#AFF",
    size: 2,
  });

  graph.addEdge("Node 1", "Node 2", {
    label: "Edge 1",
    color: "#AAF",
    size: 1,
  });

  graph.addEdge("Node 2", "Node 3", {
    label: "Edge 2",
    color: "#AFA",
    size: 2,
  });

  graph.addEdge("Node 3", "Node 1", {
    label: "Edge 3",
    color: "#FAA",
    size: 3,
  });

  new WebGraph(container, graph);
}
