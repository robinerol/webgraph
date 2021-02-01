import Graph from "graphology";
import { WebGLRenderer } from "sigma";

export class WebGraph {
  constructor(container: HTMLElement, graph: Graph) {
    new WebGLRenderer(graph, container, {
      defaultEdgeType: "arrow",
      renderEdgeLabels: true,
    });
  }
}
