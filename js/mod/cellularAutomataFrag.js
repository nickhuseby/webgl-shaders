export default /* glsl */`
precision mediump float;

uniform vec2 u_resolution;
uniform sampler2D u_texture;

varying vec2 v_texcoord;

int black_or_white(vec2 pos) {
    vec4 color = texture2D(u_texture, pos);
    if (color.rgb == vec3(0.0, 0.0, 0.0)) {
        return 0;
    } else {
        return 1;
    }
}

float evolution(vec2 pos) {
    float vert = 1.0 / u_resolution.y;
    float wid = 1.0/ u_resolution.x;
    vec2 up = vec2(0.0, vert);
    vec2 down = vec2(0.0, vert * -1.0);
    vec2 left = vec2(wid * -1.0, 0.0);
    vec2 right = vec2(wid, 0.0);
    
    int k = 0;
    if (black_or_white(pos + up + left) == 0) k+=1;    
    if (black_or_white(pos + up) == 0) k+=1;    
    if (black_or_white(pos + up + right) == 0) k+=1;    
    if (black_or_white(pos + right) == 0) k+=1;    
    if (black_or_white(pos + down + right) == 0) k+=1;    
    if (black_or_white(pos + down) == 0) k+=1;    
    if (black_or_white(pos + down + left) == 0) k+=1;    
    if (black_or_white(pos + left) == 0) k+=1;  
    
    if (k == 6) {
        return 0.0;
    } else if (k >= 8){
        return 1.0;
    }

    return texture2D(u_texture, pos).r;
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    vec2 f_st = fract(st);
    float evo = evolution(st);
    float alpha = texture2D(u_texture, st).a;
    vec4 tex = vec4(vec3(evo), alpha);
    gl_FragColor = tex;
}
`; 