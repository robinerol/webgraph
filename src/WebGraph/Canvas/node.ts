import { PartialButFor } from "sigma/types/utils";
import { NodeAttributes } from "sigma/types/types";
import { GraphConfiguration, NodeType } from "../../Configuration";

const PI_TIMES_2 = Math.PI * 2;

/**
 * Draws node.
 *
 * @param context -
 * @param data -
 * @param config -
 */
function drawNode(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "color">,
  config: GraphConfiguration
): void {
  let shape: NodeType = data.shape;
  if (!shape) {
    shape = <NodeType>config.getConfig("defaultNodeType");
  }

  switch (shape) {
    case NodeType.CIRCLE:
      drawCircle(context, data);
      break;
    case NodeType.RING:
      drawRing(context, data);
      break;
    case NodeType.RECTANGLE:
      drawRectangle(context, data);
      break;
    case NodeType.TRIANGLE:
      drawTriangle(context, data);
      break;
  }
}

function drawCircle(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "color">
): void {
  context.fillStyle = data.color;
  context.beginPath();
  context.arc(data.x, data.y, data.size, 0, PI_TIMES_2, true);
  context.closePath();
  context.fill();
}

function drawRing(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "color">
): void {
  context.fillStyle = data.color;

  context.beginPath();
  context.arc(data.x, data.y, data.size, 0, PI_TIMES_2, true);
  context.closePath();
  context.fill();

  context.beginPath();
  context.fillStyle = "#FFFFFF";
  context.arc(data.x, data.y, data.size / 2, 0, PI_TIMES_2, true);
  context.closePath();
  context.fill();
}

function drawRectangle(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "color">
): void {
  context.fillStyle = data.color;

  // multiply the width and height with 1.5 according to the scaling factor
  // in the shader. see: Shader/node.rectangle.vert.glsl
  const wh = data.size * 1.5;

  context.beginPath();
  context.rect(data.x - wh / 2, data.y - wh / 2, wh, wh);
  context.closePath();
  context.fill();
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "color">
): void {
  context.fillStyle = data.color;

  const wh = data.size * 2.0;

  context.beginPath();
  context.moveTo(data.x, data.y - wh / 2);
  context.lineTo(data.x + wh / 2, data.y + wh / 2);
  context.lineTo(data.x - wh / 2, data.y + wh / 2);
  context.lineTo(data.x, data.y - wh / 2);
  context.fill();
}

export default drawNode;
