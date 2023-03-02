// MATH

const map = /* glsl */ `
    float map(float value, float min1, float max1, float min2, float max2) {
        return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
    }
`;

const random = /* glsl */ `
    float random (vec2 st) {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))*
            43758.5453123);
    }
`;

const permute = /* glsl */ `
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
`;

const taylorInvSqrt = /* glsl */ `
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
`;

const snoise = /* glsl */ `
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
`;

// SHAPE

const line = /* glsl */ `
    float line(float x, float y, float line_width, float edge_thickness){
        return smoothstep(x-line_width/2.0-edge_thickness, x-line_width/2.0, y) - smoothstep(x+line_width/2.0, x+line_width/2.0+edge_thickness, y);
    }
`;

const polygon = /* glsl */ `
    float polygon(vec2 pt, vec2 center, float radius, int sides, float rotate, float edge_thickness){
        pt -= center;
        
        // Angle and radius from the current pixel
        float theta = atan(pt.y, pt.x) + rotate;
        float rad = PI2/float(sides);

        // Shaping function that modulate the distance
        float d = cos(floor(0.5 + theta/rad)*rad-theta)*length(pt);

        return 1.0 - smoothstep(radius, radius + edge_thickness, d);
    }
`;

const rect = /* glsl */ `
    float rect(vec2 pt, vec2 anchor, vec2 size, vec2 center) {
        vec2 p = pt - center;
        vec2 halfsize = size * 0.5;
        
        float horz = step(-halfsize.x - anchor.x, p.x) - step(halfsize.x - anchor.x, p.x);
        float vert = step(-halfsize.y - anchor.y, p.y) - step(halfsize.y - anchor.y, p.y);
        
        return horz * vert;
    }   
`;

const circle = /* glsl */ `
    float circle(vec2 pt, vec2 center, float radius, bool soften) {
        vec2 p = pt-center;
        float edge = (soften) ? radius * 0.01 : 0.0;
        return 1.0 - smoothstep(radius-edge, radius+edge, length(p));
    }

    float circle(vec2 pt, vec2 center, float radius, float line_width, bool soften) {
        vec2 p = pt-center;
        float len = length(p);
        float half_line_width = line_width / 2.0;
        float edge = (soften) ? radius * 0.01 : 0.0; 
        return smoothstep(radius-half_line_width-edge, radius-half_line_width, len) - smoothstep(radius + half_line_width, radius+half_line_width+edge, len);
    }
`;

// MATRICES

const getRotationMatrix = /* glsl */ `
    mat2 getRotationMatrix(float theta) {
        float s = sin(theta);
        float c = cos(theta);
        return mat2(c, -s, s, c);
    }
`

const getScaleMatrix = /* glsl */ `
    mat2 getScaleMatrix(float scale){
        return mat2(scale, 0, 0, scale);
    }
`;

// EXPORTS

export {
    map,
    random,
    permute,
    taylorInvSqrt,
    snoise,
    line,
    polygon,
    rect,
    circle,
    getRotationMatrix,
    getScaleMatrix,
}