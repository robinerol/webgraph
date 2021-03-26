import { PartialButFor } from "sigma/types/utils";
import { WebGLSettings } from "sigma/types/renderers/webgl/settings";
import { NodeAttributes } from "sigma/types/types";

/**
 * Renders the label of a node.
 *
 * This function is heavily copied from/based on:
 * {@see https://github.com/jacomyal/sigma.js/blob/v2/src/renderers/canvas/components/label.ts}
 *
 * @param context
 * @param data
 * @param settings
 */
function drawLabel(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeAttributes, "x" | "y" | "size" | "label" | "color">,
  settings: WebGLSettings
): void {
  const size = settings.labelSize;
  const font = settings.labelFont;
  const weight = settings.labelWeight;

  context.fillStyle = "#000";
  context.font = `${weight} ${size}px ${font}`;

  context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
}

export default drawLabel;
