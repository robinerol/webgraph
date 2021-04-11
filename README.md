# 📈 WebGraph

> A graph drawing component using [Sigma.js](https://github.com/jacomyal/sigma.js) and [Graphology](https://github.com/graphology/graphology).

[![Node.js CI](https://github.com/robinerol/webgraph/actions/workflows/node.js.yml/badge.svg)](https://github.com/robinerol/webgraph/actions/workflows/node.js.yml)

Remark: WebGraph is using a fork of Sigma.js version 2 that can be found [here](https://github.com/robinerol/sigma.js/tree/v2) on branch v2.

## 📨 Installation

```javascript
npm install github:robinerol/webgraph
```

## 🖥 Usage

Create a container for the WebGraph inside the `<body>`your HTML document:

```HTML
<div id="webGraph" style="width: 100%; height: 100%;"></div>
```

Import the `WebGraph` as well as the `Graph` from the [Graphology](https://github.com/graphology/graphology) library.

```javascript
import { WebGraph } from "webgraph";
import Graph from "graphology";
```

Get your container, create and fill the `Graph` object (See the Graphology [docs](https://graphology.github.io/) for more info.), create your config and call the `WebGraph` constructor with the container and the just created graph and config.

```javascript
const container = document.getElementById("webGraph");
const graph = new Graph();

graph.addNode("n1", {
  label: "Hello",
  x: 1,
  y: 1,
  color: "#D1495B",
  size: 10,
});

graph.addNode("n2", {
  label: "Graph!",
  x: 1,
  y: 0,
  color: "#EDAE49",
  size: 10,
});

graph.addEdge("n1", "n2", { color: "#ccc" });

const config = { highlightSubGraphOnHover: false };

const webGraph = new WebGraph(container, graph, config);
```

To finally render the graph, call:

```javascript
webGraph.render();
```

## 🖼 Example

An example usage can be found in the [demo](https://github.com/robinerol/webgraph/tree/master/demo) folder. To see the example in action run:

```javascript
npm install
npm run serve
```

And open [localhost:9001](http://localhost:9001) in your favorite browser.

## 🛠 Configuration

TBC

## 📜 License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/robinerol/webgraph/blob/master/LICENSE.txt)
