// This shader is heavily copied from/based on:
// https://github.com/jacomyal/sigma.js/blob/v2/src/renderers/webgl/shaders/node.fast.vert.glsl

attribute vec2 a_position;
attribute float a_size;
attribute vec4 a_color;

uniform float u_ratio;
uniform float u_scale;
uniform mat3 u_matrix;

varying vec4 v_color;

const float bias = 255.0 / 254.0;

void main() {

  gl_Position = vec4(
    (u_matrix * vec3(a_position, 1)).xy,
    0,
    1
  );

  gl_PointSize = a_size * u_ratio * u_scale * 2.0;

  v_color = a_color;
  v_color.a *= bias;
}
