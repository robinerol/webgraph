precision mediump float;

varying vec4 v_color;

float sign(vec2 p1, vec2 p2, vec2 p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

void main(void) {
  vec4 no_color = vec4(0.0);

  vec2 v1 = vec2(0.0, 1.0);
  vec2 v2 = vec2(0.5, 0.0);
  vec2 v3 = vec2(1.0, 1.0);

  float d1 = step(0.0, sign(gl_PointCoord, v1, v2));
  float d2 = step(0.0, sign(gl_PointCoord, v2, v3));
  float d3 = step(0.0, sign(gl_PointCoord, v3, v1));

  float alpha = step(2.9, d1 + d2 + d3);

  gl_FragColor = mix(no_color, vec4(v_color.xyz, 1.0), alpha);
}
