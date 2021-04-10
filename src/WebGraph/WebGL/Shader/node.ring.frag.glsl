precision mediump float;

varying vec4 v_color;

const float radius = 0.5;
const float halfRadius = 0.25;

void main(void) {
  float dist = length(gl_PointCoord - vec2(0.5, 0.5));

  float ring = step(halfRadius, dist) - step(radius, dist);
  
  float innerCircle = step(dist, halfRadius);
  vec4 innerColor = mix(vec4(0.0), vec4(1.0), innerCircle);

  gl_FragColor = mix(innerColor, v_color, ring);
}