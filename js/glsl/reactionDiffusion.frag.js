export default /* glsl */`
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926538

uniform vec2 u_resolution;

uniform sampler2D u_texture;

uniform float u_diffA;
uniform float u_diffB;
uniform float u_feed;
uniform float u_kill;
uniform float u_time;

vec2 laplacian(vec2 coord) {
  float w = 1.0 / u_resolution.x;
  float h = 1.0 / u_resolution.y;
  vec2 sum = vec2(0., 0.);

  float cx = coord.x;
  float cy = coord.y;
  float left = coord.x - w;
  float right = coord.x + w;
  float up = coord.y - h;
  float down = coord.y + h;

  if (left < 0.0) left = u_resolution.x - w;
  if (right >= u_resolution.x) right = 0.0;
  if (up < 0.0) up = u_resolution.y - h;
  if (down >= u_resolution.y) down = 0.0;

  sum += texture2D(u_texture, vec2(cx, cy)).rg * -1.;
  sum += texture2D(u_texture, vec2(cx, up)).rg * .2;
  sum += texture2D(u_texture, vec2(cx, down)).rg * .2;
  sum += texture2D(u_texture, vec2(left, cy)).rg * .2;
  sum += texture2D(u_texture, vec2(right, cy)).rg * .2;
  sum += texture2D(u_texture, vec2(left, up)).rg * .05;
  sum += texture2D(u_texture, vec2(right, up)).rg * .05;
  sum += texture2D(u_texture, vec2(right, down)).rg * .05;
  sum += texture2D(u_texture, vec2(left, down)).rg * .05;

  return sum;
}

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    float yCoord = u_resolution.y - gl_FragCoord.y;
    vec2 texCoord = vec2(gl_FragCoord.x, yCoord);
    vec2 coord = gl_FragCoord.xy/u_resolution.xy;

    float k = u_kill + snoise(vec3(coord, u_time/18.)) * 0.04;
    float f = u_feed + snoise(vec3(coord, u_time/19.)) * 0.02;

    vec4 prevCol = texture2D(u_texture, vec2(coord));
    float a = prevCol.r;
    float b = prevCol.g;

    vec2 lp = laplacian(vec2(coord));

    a += (u_diffA * lp.x - a * b * b + f * (1. - a)) * 1.0;
    b += (u_diffB * lp.y + a * b * b - (k + f) * b) * 1.0;

    a = clamp(a, 0.0, 1.0);
    b = clamp(b, 0.0, 1.0);

    gl_FragColor = vec4( a, b, 0.0, 1.0 );
}
`