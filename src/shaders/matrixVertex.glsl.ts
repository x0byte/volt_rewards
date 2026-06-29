export const vertexShader = `
varying vec2 vUv;

void main() {
  // Compute UV from local-space XY position on the front face.
  // Card dimensions: 3.0 wide (-1.5..1.5), 1.89 tall (-0.945..0.945)
  // This is unaffected by bevel geometry and matches the mouse handler formula.
  vUv = position.xy / vec2(1.5, 0.945) * 0.5 + 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`