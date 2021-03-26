import { PartialButFor } from "sigma/types/utils";
import { WebGLSettings } from "sigma/types/renderers/webgl/settings";
import { NodeAttributes } from "sigma/types/types";
import drawNode from "./node";
import drawLabel from "./label";
import { GraphConfiguration } from "../../Configuration";

/**
 * Draws hover
 *
 * This function is heavily copied from/based on:
 * {@see https://github.com/jacomyal/sigma.js/blob/v2/src/renderers/canvas/components/hover.ts}
 *
 * @param context
 * @param data
 * @param settings
 */
function drawHover(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "label" | "color">,
  settings: WebGLSettings,
  config: GraphConfiguration
): void {
  const size = settings.labelSize;
  const font = settings.labelFont;
  const weight = settings.labelWeight;

  context.font = `${weight} ${size}px ${font}`;

  // Then we draw the label background
  context.beginPath();
  context.fillStyle = "#fff";
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 8;
  context.shadowColor = "#000";

  const textWidth = context.measureText(data.label).width;

  const x = Math.round(data.x - size / 2 - 2),
    y = Math.round(data.y - size / 2 - 2),
    w = Math.round(textWidth + size / 2 + data.size + 9),
    h = Math.round(size + 4),
    e = Math.round(size / 2 + 2);

  context.moveTo(x, y + e);
  context.moveTo(x, y + e);
  context.arcTo(x, y, x + e, y, e);
  context.lineTo(x + w, y);
  context.lineTo(x + w, y + h);
  context.lineTo(x + e, y + h);
  context.arcTo(x, y + h, x, y + h - e, e);
  context.lineTo(x, y + e);

  context.closePath();
  context.fill();

  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // Then we need to draw the node
  drawNode(context, data, config);

  // And finally we draw the label
  drawLabel(context, data, settings);
}

export default drawHover;
