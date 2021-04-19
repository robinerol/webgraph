/**
 * Node triangle program
 *
 * This file is heavily copied from/based on:
 * {@see https://github.com/jacomyal/sigma.js/blob/v2/src/renderers/webgl/programs/node.fast.ts}
 */

import { RenderNodeParams } from "sigma/types/renderers/webgl/programs/common/node";
import { AbstractNodeProgram, floatColor } from "sigma";
import { NodeAttributes } from "sigma/types/types";
import vertexShaderSource from "../Shader/node.vert.glsl";
import fragmentShaderSource from "../Shader/node.triangle.frag.glsl";

const POINTS = 1,
  ATTRIBUTES = 4;

class NodeTriangleProgram extends AbstractNodeProgram {
  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSource, fragmentShaderSource, POINTS, ATTRIBUTES);
  }

  process(data: NodeAttributes, offset: number): void {
    if (data.color === undefined) {
      data.color = "#000";
    }

    const color = floatColor(data.color);

    let i = offset * POINTS * ATTRIBUTES;

    const array = this.array;

    if (data.hidden) {
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      array[i] = 0;

      return;
    }

    array[i++] = data.x;
    array[i++] = data.y;
    array[i++] = data.size;
    array[i] = color;
  }

  render(params: RenderNodeParams): void {
    this.bind();

    const gl = this.gl;

    const program = this.program;
    gl.useProgram(program);

    gl.uniform1f(
      this.ratioLocation,
      1 / Math.pow(params.ratio, params.nodesPowRatio)
    );
    gl.uniform1f(this.scaleLocation, params.scalingRatio);
    gl.uniformMatrix3fv(this.matrixLocation, false, params.matrix);

    gl.drawArrays(gl.POINTS, 0, this.array.length / ATTRIBUTES);
  }
}

export { NodeTriangleProgram };
