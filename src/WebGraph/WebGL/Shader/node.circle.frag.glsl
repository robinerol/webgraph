precision mediump float;

varying vec4 v_color;

const float radius = 0.5;

void main(void) {
  vec2 m = gl_PointCoord - vec2(0.5, 0.5);
  float dist = length(m);

  float visibleArea = step(dist, radius);

  gl_FragColor = mix(vec4(0.0), v_color, visibleArea);
}
