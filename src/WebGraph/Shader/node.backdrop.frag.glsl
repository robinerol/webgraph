precision mediump float;

varying vec4 v_color;

void main(void) {
  float dist = length(gl_PointCoord - vec2(0.5, 0.5));

  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

  gl_FragColor = v_color * alpha;
}
