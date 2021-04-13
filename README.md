# 📈 WebGraph

> A graph drawing component using [Sigma.js](https://github.com/jacomyal/sigma.js) and [Graphology](https://github.com/graphology/graphology).

[![Node.js CI](https://github.com/robinerol/webgraph/actions/workflows/node.js.yml/badge.svg)](https://github.com/robinerol/webgraph/actions/workflows/node.js.yml)

Remark: WebGraph is using a fork of Sigma.js version 2 that can be found [here](https://github.com/robinerol/sigma.js/tree/v2) on branch v2.

## 📨 Installation

```javascript
npm install github:robinerol/webgraph
```

## 🖥 Usage

Create a container for the WebGraph inside the `<body>` of your HTML document:

```HTML
<div id="webGraph" style="width: 100%; height: 100%;"></div>
```

Import the `WebGraph` as well as the `Graph` from the [Graphology](https://github.com/graphology/graphology) library into your JavaScript/TypeScript file.

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

An example usage can be found in the [demo](https://github.com/robinerol/webgraph/tree/master/demo) folder. To see the example in action clone the repository, run:

```javascript
npm install
npm run serve
```

and open [localhost:9001](http://localhost:9001) using your favorite browser.

## 🛠 Configuration

### 🧾 Overview

Here is a list of all available configurations. None of the configurations is mandatory to set and some do have default values.

<table>
  <thead>
    <tr>
      <th>Configuration</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default value</th>
    </tr>
    <tr></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>layout</code></td>
      <td><a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/layouts.ts#L11">Layout</a></td>
      <td>Specifies the Layout to be applied to the graph.</td>
      <td><code>Layout.PREDEFINED</code></td>
    </tr>
    <tr>
      <td><code>layoutConfiguration</code></td>
      <td><a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/layouts.ts#L102">ILayoutConfiguration</a></td>
      <td>Configurations to be applied to the selected <code>Layout</code>. More info can be found <a href="https://github.com/graphology/graphology-layout#readme">here</a> and <a href="https://github.com/graphology/graphology-layout-forceatlas2#readme">here</a>.</td>
      <td><code>{predefinedLayoutOptions: {}}</code></td>
    </tr>
    <tr>
      <td><code>appMode</code></td>
      <td><a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/appmode.ts#L6">AppMode</a></td>
      <td>Sets the mode of the WebGraph to <code>DYNAMIC</code> (nodes can be dragged) or <code>STATIC</code> (nodes are static).</td>
      <td><code>AppMode.STATIC</code></td>
    </tr>
    <tr>
      <td><code>contextMenus</code></td>
      <td><a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/contextmenu.ts#L32">IContextMenu</a></td>
      <td>Used to apply a context menu to a node, which appears on a right click on a node. For further details see the <a name="Configuration">Context Menus</a> section.</td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td><code>suppressContextMenu</code></td>
      <td>boolean</td>
      <td>Whether the default browser context menu should be suppressed or not on a right click on the graph.</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>disableHover</code></td>
      <td>boolean</td>
      <td>If set to true, nothing will happen on a hover over a node. Please beware, that the <code>highlightSubGraphOnHover</code> configuration is completely independent from this configuration and will work, even if <code>disableHover</code> is set to true.</td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>hoverCallbacks</code></td>
      <td><a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L38">IHoverCallback</a></td>
      <td>Used to apply a custom hover container to a node. For further details see the <a name="Hover-Callback">Hover Callbacks</a> section.</td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td><code>highlightSubGraphOnHover</code></td>
      <td>boolean</td>
      <td>If enabled, a hover over a node will also highlight directly connected nodes and the corresponding edges. Set a default color on nodes and edges for it to work smoothly.</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>subGraphHighlightColor</code></td>
      <td>string</td>
      <td>The color used to highlight the subgraph that is being highlighted on a hover.</td>
      <td><code>#e57a2d</code></td>
    </tr>
    <tr>
      <td><code>defaultNodeType</code></td>
      <td><a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/nodetype.ts#L6">NodeType</a></td>
      <td>The default node type/shape for nodes.</td>
      <td><code>NodeType.RING</code></td>
    </tr>
    <tr>
      <td><code>enableHistory</code></td>
      <td>boolean</td>
      <td>If enabled all interactions with the WebGraph will be logged which enables undo and redo operations using the undo() and redo() methods.</td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>sigmaSettings</code></td>
      <td><a href="https://github.com/robinerol/sigma.js/blob/75ce5e94353f9791aa84176165f801c97b420bee/src/renderers/webgl/settings.ts#L40">Partial&lt;WebGLSettings&gt;</a></td>
      <td>The settings directly passed into the Sigma.js graph renderer. See the <a name="sigma-settings">Sigma Settings</a> sections for more details.</td>
      <td><code>{}</code></td>
    </tr>
  </tbody>
</table>

### ⚫️ Node Attributes

A list of all attributes impacting the rendered graph. Custom attributes can be added.

<table>
  <thead>
    <tr>
      <th>Attribute</th>
      <th>Type</th>
      <th>Used for</th>
      <th>Mandatory</th>
    </tr>
    <tr></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>key</code></td>
      <td><a href="https://github.com/graphology/graphology-types/blob/075623d813d7ba2fd967427407cefb708dbccb7e/index.d.ts#L13">NodeKey</a></td>
      <td>Node ID</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td><code>x</code></td>
      <td>number</td>
      <td>Node x position</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td><code>y</code></td>
      <td>number</td>
      <td>Node y position</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td><code>label</code></td>
      <td>string</td>
      <td>Node label</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>color</code></td>
      <td>string</td>
      <td>Node color</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>size</code></td>
      <td>number</td>
      <td>Node size</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>hidden</code></td>
      <td>boolean</td>
      <td>Visibility</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>type</code></td>
      <td><a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/nodetype.ts#L6">NodeType</a></td>
      <td>Node type/shape</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>category</code></td>
      <td>number</td>
      <td><a name="context-menus">Context Menus</a><br/><a name="hover-callbacks">Hover Callbacks</a></td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>score</code></td>
      <td>number</td>
      <td><a name="hover-callbacks">Hover Callbacks</a></td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>cluster</code></td>
      <td>number</td>
      <td>Cluster backdrop<br/>See: <a name="sigma-settings">Sigma Settings</a></td>
      <td>No</td>
    </tr>
  </tbody>
</table>

### ➖ Edge Attributes

A list of all attributes impacting the rendered graph. Custom attributes can be added.

<table>
  <thead>
    <tr>
      <th>Attribute</th>
      <th>Type</th>
      <th>Used for</th>
      <th>Mandatory</th>
    </tr>
    <tr></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>source</code></td>
      <td><a href="https://github.com/graphology/graphology-types/blob/075623d813d7ba2fd967427407cefb708dbccb7e/index.d.ts#L13">NodeKey</a></td>
      <td>Source node</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td><code>target</code></td>
      <td><a href="https://github.com/graphology/graphology-types/blob/075623d813d7ba2fd967427407cefb708dbccb7e/index.d.ts#L13">NodeKey</a></td>
      <td>Target node</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td><code>key</code></td>
      <td><a href="https://github.com/graphology/graphology-types/blob/075623d813d7ba2fd967427407cefb708dbccb7e/index.d.ts#L14">EdgeKey</a></td>
      <td>Edge ID</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>label</code></td>
      <td>string</td>
      <td>Edge label</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>color</code></td>
      <td>string</td>
      <td>Edge color</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>hidden</code></td>
      <td>boolean</td>
      <td>Visibility</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>important</code></td>
      <td>boolean</td>
      <td>Render important/all</td>
      <td>No</td>
    </tr>
    <tr>
      <td><code>weight</code></td>
      <td>number</td>
      <td>ForceAtlas2 Layout</td>
      <td>No</td>
    </tr>
  </tbody>
</table>

### 📑 Context Menus

A custom context menu is opened on a right click on a node. If no <a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/contextmenu.ts#L32">IContextMenu</a> is present, nothing will happen on a right click. To reduce redundant code, many nodes share one type of context menu. Context menus are mapped to nodes using the <code>category</code> attribute. To pass context menus to the WebGraph use the <code>contextMenus</code> configuration, pass one or more context menus using the <code>entries</code> field and set the <code>category</code> attribute on nodes.

The number given in the <code>entries</code> field of an <a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/contextmenu.ts#L32">IContextMenu</a> represents the <code>category</code> the node belongs to:

- A node with attribute <code>category: 0</code> would get the [ContextMenuItem](https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/contextmenu.ts#L56)s mapped to 0
- A node with attribute <code>category: 1</code> would get the [ContextMenuItem](https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/contextmenu.ts#L56)s mapped to 1
- ...

For the context menu to work, a container needs to be passed to the WebGraph to mount the context menus in. Create a container for the context menu in your HTML:

```HTML
<div id="webGraphCM" class="hide"></div>
```

This container can be freely styled. Then retrieve the container in your script code and pass it to the WebGraph with the other necessary [parameters](https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/contextmenu.ts#L32). The context menu will be mounted into the container like follows:

```HTML
<div>
  <!-- Here begins the mounted part -->
  <ol>
    <li onclick="IContextMenuItem.callback">
      <img src="IContextMenuItem.icon" style="display: inline-block; height: 1em; overflow: hidden; background-repeat: no-repeat;">
      <span>IContextMenuItem.label</span>
    </li>
  </ol>
  <!-- Here ends the mounted part -->
</div>
```

There is no default value for the category attribute of nodes, if it's not present. If a node doesn't have a category, it won't have a context menu.

### 👁‍🗨 Hover Callbacks

Hover callbacks work similar to context menus, but are used to display data on hover over a node. If no [IHoverCallback](https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L38) is present, nothing will happen on hover. To reduce redundant code, many nodes share one type of hover callbacks. Callbacks are mapped to nodes using the <code>category</code> attribute. To pass hover callbacks to the WebGraph use the <code>hoverCallbacks</code> configuration, pass one or more hover callbacks using the <code>callback</code> field and set the <code>category</code> attribute on nodes.

The number given in the <code>callback</code> field of an [IHoverCallback](https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L38) represents the <code>category</code> the node belongs to:

- A node with attribute <code>category: 0</code> would get the callback mapped to 0
- A node with attribute <code>category: 1</code> would get the callback mapped to 1
- ...

Callbacks are used to load additional data to display on hover for a node to reduce the amount of data that has to be stored locally. Therefore, a callback receives the <a href="https://github.com/graphology/graphology-types/blob/075623d813d7ba2fd967427407cefb708dbccb7e/index.d.ts#L13">NodeKey</a> of the hovered node as well as the <code>score</code> attribute if previously set as inputs. The return value of such a callback must be a <code>Partial&lt;<a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L56">IHoverContent</a>&gt;</code>. The content of this <code>Partial&lt;<a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L56">IHoverContent</a>&gt;</code> will be parsed and mounted into a given container.

For the context menu to work, a container needs to be passed to the WebGraph to mount the <a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L56">IHoverContent</a> in. Create a container for the context menu in your HTML:

```HTML
<div id="webGraphHC" class="hide"></div>
```

This container can be freely styled. Then retrieve the container in your script code and pass it to the WebGraph with the other necessary [parameters](https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L38). The <a href="https://github.com/robinerol/webgraph/blob/f27997b49ab51c3fc92924f8790a1d094d8232e2/src/Configuration/hovercallback.ts#L56">IHoverContent</a> will be mounted into the container like follows:

```HTML
<div>
  <!-- Here begins the mounted part -->
  <span id="preheader">IHoverContent.preheader</span>
  <span id="header">IHoverContent.header</span>
  <span id="content">IHoverContent.content</span>
  <span id="footer">IHoverContent.footer</span>
  <!-- Here ends the mounted part -->
</div>
```

There is no default value for the category attribute of nodes, if it's not present. If a node doesn't have a category, it won't execute a callback on hover.

### ⚙️ Sigma Settings

Since WebGraph is using [modified version](https://github.com/robinerol/sigma.js/tree/v2) of sigma.js v2 as base renderer for the graph, some settings only affect the default sigma.js components but are without effect on extensions like i.e. the hover callbacks. All available settings for sigma.js can be found [here](https://github.com/robinerol/sigma.js/blob/75ce5e94353f9791aa84176165f801c97b420bee/src/renderers/webgl/settings.ts#L40). For further information on these settings refer to the official sigma.js [repository](https://github.com/jacomyal/sigma.js/tree/v2). The table below only holds the settings that have been added to sigma.js in the modified version:

<table>
  <thead>
    <tr>
      <th>Configuration</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default value</th>
    </tr>
    <tr></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>hideEdges</code></td>
      <td>boolean</td>
      <td>Whether edges should be initially hidden or not.</td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>renderJustImportantEdges</code></td>
      <td>boolean</td>
      <td>Whether all edges or just the edges holding the <code>important</code> attribute with the value <code>true</code> should be rendered.</td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>renderNodeBackdrop</code></td>
      <td>boolean</td>
      <td>If true, renders a backdrop on a node to create a cluster effect on nodes of the same cluster.</td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>clusterColors</code></td>
      <td>Record&lt;number, string&gt;</td>
      <td>A record mapping the <code>cluster</code> attributes of nodes to colors. These colors will be used as colors for the backdrop.</td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td><code>nodeBackdropProgram</code></td>
      <td><a href ="https://github.com/robinerol/sigma.js/blob/75ce5e94353f9791aa84176165f801c97b420bee/src/renderers/webgl/programs/common/node.ts#L87">NodeProgramConstructor</a></td>
      <td>A WebGL program to render the backdrop of a node. If <code>renderNodeBackdrop</code> is set to true and no backdrop program is provided to WebGraph, a default backdrop program will be used.</td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td><code>labelFontColor</code></td>
      <td>string</td>
      <td>The color of a nodes label.</td>
      <td><code>#000</code></td>
    </tr>
    <tr>
      <td><code>labelSelector</code></td>
      <td><a href="https://github.com/robinerol/sigma.js/blob/75ce5e94353f9791aa84176165f801c97b420bee/src/heuristics/labels.ts#L60">labelsToDisplayFromGrid</a></td>
      <td>Overrides the internal label selector. Will be automatically overwritten by WebGraph and is just here for completeness.</td>
      <td><code><a href="https://github.com/robinerol/sigma.js/blob/75ce5e94353f9791aa84176165f801c97b420bee/src/heuristics/labels.ts#L60">labelsToDisplayFromGrid</a></code></td>
    </tr>
  </tbody>
</table>

## 📜 License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/robinerol/webgraph/blob/master/LICENSE.txt)
