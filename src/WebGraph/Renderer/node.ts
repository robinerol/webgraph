import { PartialButFor } from "sigma/types/utils";
import { NodeAttributes } from "sigma/types/types";

const PI_TIMES_2 = Math.PI * 2;

/**
 * Draws node.
 *
 * This function is heavily copied from/based on:
 * {@see https://github.com/jacomyal/sigma.js/blob/v2/src/renderers/canvas/components/node.ts}
 *
 * @param context
 * @param data
 */
function drawNode(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "color">
): void {
  context.fillStyle = data.color;
  context.beginPath();
  context.arc(data.x, data.y, data.size, 0, PI_TIMES_2, true);

  context.closePath();
  context.fill();
}

export default drawNode;
