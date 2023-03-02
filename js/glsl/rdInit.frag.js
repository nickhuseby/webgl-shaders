import { circle } from './funcs.util.js';

export default /* glsl */ `
precision mediump float;

uniform vec2 u_resolution;

${circle}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float inCircle = circle(st, vec2(0.5), 0.33, true);
    gl_FragColor = vec4(inCircle, 1.0-inCircle, 0.0, 1.0);
}
`;