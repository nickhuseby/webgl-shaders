export default /* glsl */`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float map() {
    return 0.0;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    float rnd = random(vec2(gl_FragCoord.xy));
    float locked;

    if (rnd > 0.5) {
        locked = 1.0;
    }

    if (rnd <= 0.5) {
        locked = 0.0;
    }

    gl_FragColor = vec4(vec3(locked), rnd);
}
`;